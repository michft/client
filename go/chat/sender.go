package chat

import (
	"encoding/binary"
	"sync"
	"time"

	"github.com/keybase/client/go/chat/storage"
	"github.com/keybase/client/go/libkb"
	"github.com/keybase/client/go/protocol/chat1"
	"github.com/keybase/client/go/protocol/keybase1"
	"golang.org/x/net/context"
)

type Sender interface {
	Send(ctx context.Context, convID chat1.ConversationID, msg chat1.MessageBoxed) (chat1.OutboxID, *chat1.RateLimit, error)
}

type CachingSender struct {
	libkb.Contextified
	getRi func() chat1.RemoteInterface
}

func NewCachingSender(g *libkb.GlobalContext, getRi func() chat1.RemoteInterface) *CachingSender {
	return &CachingSender{
		Contextified: libkb.NewContextified(g),
		getRi:        getRi,
	}
}

func (s *CachingSender) Send(ctx context.Context, convID chat1.ConversationID,
	msg chat1.MessageBoxed) (chat1.OutboxID, *chat1.RateLimit, error) {

	rarg := chat1.PostRemoteArg{
		ConversationID: convID,
		MessageBoxed:   msg,
	}
	plres, err := s.getRi().PostRemote(ctx, rarg)
	if err != nil {
		return chat1.OutboxID{}, nil, err
	}
	msg.ServerHeader = &plres.MsgHeader

	// Write new message out to cache
	if _, err := s.G().ConvSource.Push(ctx, convID, msg.ClientHeader.Sender, msg); err != nil {
		return chat1.OutboxID{}, nil, err
	}
	res := make([]byte, 4)
	binary.LittleEndian.PutUint32(res, uint32(msg.GetMessageID()))
	return res, plres.RateLimit, nil
}

type NonblockingSender struct {
	libkb.Contextified

	sender Sender
	outbox *storage.Outbox
}

var deliverLoopOnce sync.Once
var msgSentCh chan struct{}

func NewNonblockingSender(g *libkb.GlobalContext, sender Sender) *NonblockingSender {

	s := &NonblockingSender{
		Contextified: libkb.NewContextified(g),
		sender:       sender,
		outbox:       storage.NewOutbox(g),
	}

	// Start up deliver routine
	deliverLoopOnce.Do(func() {
		msgSentCh = make(chan struct{}, 100)
		go s.deliverLoop()
	})

	return s
}

func (s *NonblockingSender) Send(ctx context.Context, convID chat1.ConversationID,
	msg chat1.MessageBoxed) (chat1.OutboxID, *chat1.RateLimit, error) {

	// Push onto outbox and immediatley return
	oid, err := s.outbox.Push(convID, msg)
	if err != nil {
		return chat1.OutboxID{}, nil, err
	}

	// Alert the deliver loop it should wake up
	msgSentCh <- struct{}{}

	return oid, nil, nil
}

func (s *NonblockingSender) deliverLoop() {
	for {
		// Wait for the signal to take action
		select {
		case <-msgSentCh:
			s.G().Log.Debug("flushing outbox on new message")
		case <-s.G().Clock().After(time.Minute):
		}

		// Fetch outbox
		obrs, err := s.outbox.Pull()
		if err != nil {
			s.G().Log.Error("unable to pull outbox: err: %s", err.Error())
			continue
		}
		if len(obrs) > 0 {
			s.G().Log.Debug("flushing %d items from the outbox", len(obrs))
		}

		// Send messages
		pops := 0
		for _, obr := range obrs {
			_, rl, err := s.sender.Send(context.Background(), obr.ConvID, obr.Msg)
			if err != nil {
				s.G().Log.Error("failed to send msg: convID: %s err: %s", obr.ConvID, err.Error())
				break
			}

			// Notify everyone that this sent
			activity := chat1.NewChatActivityWithMessageSent(chat1.MessageSentInfo{
				ConvID:    obr.ConvID,
				OutboxID:  obr.OutboxID,
				RateLimit: *rl,
			})
			s.G().NotifyRouter.HandleNewChatActivity(context.Background(),
				keybase1.UID(obr.Msg.ClientHeader.Sender.String()), &activity)
			pops++
		}
		if err = s.outbox.PopN(pops); err != nil {
			s.G().Log.Error("failed to clear messages from outbox: err: %s", err.Error())
		}
	}
}

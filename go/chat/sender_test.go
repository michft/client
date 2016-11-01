package chat

import (
	"sync"
	"testing"
	"time"

	"github.com/jonboulle/clockwork"
	"github.com/keybase/client/go/chat/storage"
	"github.com/keybase/client/go/kbtest"
	"github.com/keybase/client/go/libkb"
	"github.com/keybase/client/go/protocol/chat1"
	"github.com/keybase/client/go/protocol/keybase1"
	"github.com/stretchr/testify/require"
	"golang.org/x/net/context"
)

type chatListener struct {
	sync.Mutex
	obids  []chat1.OutboxID
	action chan int
}

func (n *chatListener) Logout()                                                      {}
func (n *chatListener) Login(username string)                                        {}
func (n *chatListener) ClientOutOfDate(to, uri, msg string)                          {}
func (n *chatListener) UserChanged(uid keybase1.UID)                                 {}
func (n *chatListener) TrackingChanged(uid keybase1.UID, username string)            {}
func (n *chatListener) FSActivity(activity keybase1.FSNotification)                  {}
func (n *chatListener) FSEditListResponse(arg keybase1.FSEditListArg)                {}
func (n *chatListener) FSEditListRequest(arg keybase1.FSEditListRequest)             {}
func (n *chatListener) PaperKeyCached(uid keybase1.UID, encKID, sigKID keybase1.KID) {}
func (n *chatListener) FavoritesChanged(uid keybase1.UID)                            {}
func (n *chatListener) KeyfamilyChanged(uid keybase1.UID)                            {}
func (n *chatListener) PGPKeyInSecretStoreFile()                                     {}
func (n *chatListener) NewChatActivity(uid keybase1.UID, activity chat1.ChatActivity) {
	n.Lock()
	defer n.Unlock()
	typ, err := activity.ActivityType()
	if err == nil && typ == chat1.ChatActivityType_MESSAGE_SENT {
		n.obids = append(n.obids, activity.MessageSent().OutboxID)
		n.action <- len(n.obids)
	}
}

func TestNonblockChannel(t *testing.T) {
	tc := libkb.SetupTest(t, "chatsender", 2)
	defer tc.Cleanup()
	tc.G.SetService()
	world := kbtest.NewChatMockWorld(t, "chatsender", 1)
	ri := kbtest.NewChatRemoteMock(world)
	sender := NewNonblockingSender(tc.G, NewCachingSender(tc.G, func() chat1.RemoteInterface {
		return ri
	}))
	listener := chatListener{
		action: make(chan int),
	}
	tc.G.ConvSource = NewRemoteConversationSource(tc.G, NewBoxer(tc.G, nil, nil), ri)
	tc.G.NotifyRouter.SetListener(&listener)

	res, err := ri.NewConversationRemote2(context.TODO(), chat1.NewConversationRemote2Arg{
		IdTriple: chat1.ConversationIDTriple{
			Tlfid:     []byte{4, 5, 6},
			TopicType: 0,
			TopicID:   []byte{0},
		},
	})
	require.NoError(t, err)
	obid, _, err := sender.Send(context.TODO(), res.ConvID, chat1.MessageBoxed{})
	require.NoError(t, err)

	<-listener.action

	require.Equal(t, 1, len(listener.obids), "wrong length")
	require.Equal(t, obid, listener.obids[0], "wrong obid")
}

func TestNonblockTimer(t *testing.T) {
	tc := libkb.SetupTest(t, "chatsender", 2)
	defer tc.Cleanup()
	tc.G.SetService()
	world := kbtest.NewChatMockWorld(t, "chatsender", 1)
	ri := kbtest.NewChatRemoteMock(world)
	clock := clockwork.NewFakeClock()
	tc.G.SetClock(clock)
	NewNonblockingSender(tc.G, NewCachingSender(tc.G, func() chat1.RemoteInterface {
		return ri
	}))
	listener := chatListener{
		action: make(chan int),
	}

	tc.G.ConvSource = NewRemoteConversationSource(tc.G, NewBoxer(tc.G, nil, nil), ri)
	tc.G.NotifyRouter.SetListener(&listener)

	res, err := ri.NewConversationRemote2(context.TODO(), chat1.NewConversationRemote2Arg{
		IdTriple: chat1.ConversationIDTriple{
			Tlfid:     []byte{4, 5, 6},
			TopicType: 0,
			TopicID:   []byte{0},
		},
	})
	require.NoError(t, err)

	outbox := storage.NewOutbox(tc.G)
	var obids []chat1.OutboxID
	for i := 0; i < 5; i++ {
		obid, err := outbox.Push(res.ConvID, chat1.MessageBoxed{})
		require.NoError(t, err)
		obids = append(obids, obid)
	}

	// Make we get nothing until timer is up
	select {
	case <-listener.action:
		require.Fail(t, "action event received too soon")
	default:
	}

	clock.Advance(5 * time.Minute)

	// Should get a blast of all 5
	var olen int
	for i := 0; i < 5; i++ {
		select {
		case olen = <-listener.action:
		case <-time.After(2 * time.Second):
			require.Fail(t, "event not received")
		}

		require.Equal(t, i+1, olen, "wrong length")
		require.Equal(t, obids[i], listener.obids[i], "wrong obid")
	}

	// Make sure it is really empty
	clock.Advance(5 * time.Minute)
	select {
	case <-listener.action:
		require.Fail(t, "action event received too soon")
	default:
	}
}
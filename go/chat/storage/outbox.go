package storage

import (
	"fmt"
	"sync"

	"github.com/keybase/client/go/libkb"
	"github.com/keybase/client/go/protocol/chat1"
	"github.com/keybase/client/go/protocol/gregor1"
)

type OutboxID []byte

type Outbox struct {
	sync.Mutex
	libkb.Contextified
}

type OutboxRecord struct {
	Msg      chat1.MessageBoxed `codec:"M"`
	OutboxID chat1.OutboxID     `codec:"O"`
}

func NewOutbox(g *libkb.GlobalContext) *Outbox {
	return &Outbox{
		Contextified: libkb.NewContextified(g),
	}
}

func (o *Outbox) dbKey(uid gregor1.UID, convID chat1.ConversationID) libkb.DbKey {
	return libkb.DbKey{
		Typ: libkb.DBChatOutbox,
		Key: fmt.Sprintf("ob:%s:%s", uid, convID),
	}
}

func (o *Outbox) readBox(uid gregor1.UID, convID chat1.ConversationID) ([]OutboxRecord, error) {
	key := o.dbKey(uid, convID)
	b, found, err := o.G().LocalChatDb.GetRaw(key)
	if err != nil {
		return nil, err
	}
	if !found {
		return []OutboxRecord{}, nil
	}

	var res []OutboxRecord
	if err := decode(b, res); err != nil {
		return nil, err
	}

	return res, nil
}

func (o *Outbox) writeBox(uid gregor1.UID, convID chat1.ConversationID, outbox []OutboxRecord) error {
	key := o.dbKey(uid, convID)

	dat, err := encode(outbox)
	if err != nil {
		return err
	}

	if err = o.G().LocalChatDb.PutRaw(key, dat); err != nil {
		return err
	}

	return nil
}

func (o *Outbox) Push(uid gregor1.UID, convID chat1.ConversationID, msg chat1.MessageBoxed) (chat1.OutboxID, libkb.ChatStorageError) {
	o.Lock()
	defer o.Unlock()

	// Read outbox for the user
	obox, err := o.readBox(uid, convID)
	if err != nil {
		return nil, libkb.NewChatStorageInternalError(o.G(), "error reading outbox: err: %s", err.Error())
	}

	// Generate new outbox ID
	var outboxID chat1.OutboxID
	outboxID, err = libkb.RandBytes(16)
	if err != nil {
		return nil, libkb.NewChatStorageInternalError(o.G(), "error getting outboxID: err: %s", err.Error())
	}

	// Append record
	obox = append(obox, OutboxRecord{
		Msg:      msg,
		OutboxID: outboxID,
	})

	// Write out box
	if err := o.writeBox(uid, convID, obox); err != nil {
		return nil, libkb.NewChatStorageInternalError(o.G(), "error writing outbox: err: %s", err.Error())
	}

	return outboxID, nil
}

func (o *Outbox) Pull(uid gregor1.UID, convID chat1.ConversationID) ([]OutboxRecord, error) {
	o.Lock()
	defer o.Unlock()

	// Read outbox for the user
	obox, err := o.readBox(uid, convID)
	if err != nil {
		return nil, libkb.NewChatStorageInternalError(o.G(), "error reading outbox: err: %s", err.Error())
	}

	return obox, nil
}

func (o *Outbox) PopN(uid gregor1.UID, convID chat1.ConversationID, n int) error {
	o.Lock()
	defer o.Unlock()

	// Read outbox for the user
	obox, err := o.readBox(uid, convID)
	if err != nil {
		return libkb.NewChatStorageInternalError(o.G(), "error reading outbox: err: %s", err.Error())
	}

	// Pop N off front
	obox = obox[n:]

	// Write out box
	if err := o.writeBox(uid, convID, obox); err != nil {
		return libkb.NewChatStorageInternalError(o.G(), "error writing outbox: err: %s", err.Error())
	}

	return nil
}

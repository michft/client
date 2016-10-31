package storage

import (
	"sync"

	"github.com/keybase/client/go/libkb"
	"github.com/keybase/client/go/protocol/chat1"
)

type Outbox struct {
	sync.Mutex
	libkb.Contextified
}

type OutboxRecord struct {
	ConvID   chat1.ConversationID `codec:"C"`
	OutboxID chat1.OutboxID       `codec:"O"`
	Msg      chat1.MessageBoxed   `codec:"M"`
}

func NewOutbox(g *libkb.GlobalContext) *Outbox {
	return &Outbox{
		Contextified: libkb.NewContextified(g),
	}
}

func (o *Outbox) dbKey() libkb.DbKey {
	return libkb.DbKey{
		Typ: libkb.DBChatOutbox,
		Key: "ob",
	}
}

func (o *Outbox) readBox() ([]OutboxRecord, error) {
	key := o.dbKey()
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

func (o *Outbox) writeBox(outbox []OutboxRecord) error {
	key := o.dbKey()

	dat, err := encode(outbox)
	if err != nil {
		return err
	}

	if err = o.G().LocalChatDb.PutRaw(key, dat); err != nil {
		return err
	}

	return nil
}

func (o *Outbox) Push(convID chat1.ConversationID, msg chat1.MessageBoxed) (chat1.OutboxID, libkb.ChatStorageError) {
	o.Lock()
	defer o.Unlock()

	// Read outbox for the user
	obox, err := o.readBox()
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
		ConvID:   convID,
		OutboxID: outboxID,
	})

	// Write out box
	if err := o.writeBox(obox); err != nil {
		return nil, libkb.NewChatStorageInternalError(o.G(), "error writing outbox: err: %s", err.Error())
	}

	return outboxID, nil
}

func (o *Outbox) Pull() ([]OutboxRecord, error) {
	o.Lock()
	defer o.Unlock()

	// Read outbox for the user
	obox, err := o.readBox()
	if err != nil {
		return nil, libkb.NewChatStorageInternalError(o.G(), "error reading outbox: err: %s", err.Error())
	}

	return obox, nil
}

func (o *Outbox) PopN(n int) error {
	o.Lock()
	defer o.Unlock()

	// Read outbox for the user
	obox, err := o.readBox()
	if err != nil {
		return libkb.NewChatStorageInternalError(o.G(), "error reading outbox: err: %s", err.Error())
	}

	// Pop N off front
	obox = obox[n:]

	// Write out box
	if err := o.writeBox(obox); err != nil {
		return libkb.NewChatStorageInternalError(o.G(), "error writing outbox: err: %s", err.Error())
	}

	return nil
}

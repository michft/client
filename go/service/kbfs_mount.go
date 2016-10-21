// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package service

import (
	"golang.org/x/net/context"
	"os"

	"github.com/keybase/client/go/libkb"
	//	keybase1 "github.com/keybase/client/go/protocol/keybase1"
	"github.com/keybase/go-framed-msgpack-rpc/rpc"
)

type KBFSMountHandler struct {
	*BaseHandler
	libkb.Contextified
}

func NewKBFSMountHandler(xp rpc.Transporter, g *libkb.GlobalContext) *KBFSMountHandler {
	return &KBFSMountHandler{
		BaseHandler:  NewBaseHandler(xp),
		Contextified: libkb.NewContextified(g),
	}
}

func (h *KBFSMountHandler) GetCurrentDriveLetter(ctx context.Context) (res string, err error) {

	mountdir := os.Getenv("KEYBASE_DRIVE_LETTER")
	if mountdir == "" {
		i, err := h.G().Env.GetConfig().GetInterfaceAtPath("mountdir")
		if err == nil {
			mountdir = i.(string)
		}
	}
	if mountdir == "" {
		drives := getDriveLetters(true)
		if len(drives) > 0 {
			mountdir = drives[0]
			h.SetCurrentDriveLetter(ctx, mountdir)
		}
	}
	return mountdir, err
}

func (h *KBFSMountHandler) GetAllAvailableDriveLetters(ctx context.Context) (res []string, err error) {
	return getDriveLetters(false), nil
}

func (h *KBFSMountHandler) SetCurrentDriveLetter(_ context.Context, drive string) (err error) {
	w := h.G().Env.GetConfigWriter()
	w.SetStringAtPath("mountdir", drive)
	h.G().ConfigReload()
	return nil
}

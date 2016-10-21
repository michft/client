// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

// +build !windows

package service

import (
	"github.com/keybase/go-updater/watchdog"
)

func getDriveLetter(log logger.Logger) (string, error) {
	return "", fmt.Errorf("getDriveLetter is Windows only", runMode)
}

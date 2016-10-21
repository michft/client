// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

// +build windows

package service

import (
	"strings"
	"syscall"
	"unsafe"
)

func getVolumeName(RootPathName string) (string, error) {
	var VolumeNameBuffer = make([]uint16, syscall.MAX_PATH+1)
	var nVolumeNameSize = uint32(len(VolumeNameBuffer))
	var VolumeSerialNumber uint32
	var MaximumComponentLength uint32
	var FileSystemFlags uint32
	var FileSystemNameBuffer = make([]uint16, 255)
	var nFileSystemNameSize = syscall.MAX_PATH + 1

	kernel32, _ := syscall.LoadLibrary("kernel32.dll")
	getVolume, _ := syscall.GetProcAddress(kernel32, "GetVolumeInformationW")

	var nargs uintptr = 8
	_, _, callErr := syscall.Syscall9(uintptr(getVolume),
		nargs,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(RootPathName))),
		uintptr(unsafe.Pointer(&VolumeNameBuffer[0])),
		uintptr(nVolumeNameSize),
		uintptr(unsafe.Pointer(&VolumeSerialNumber)),
		uintptr(unsafe.Pointer(&MaximumComponentLength)),
		uintptr(unsafe.Pointer(&FileSystemFlags)),
		uintptr(unsafe.Pointer(&FileSystemNameBuffer[0])),
		uintptr(nFileSystemNameSize),
		0)

	if callErr != 0 {
		return "", callErr
	}

	return syscall.UTF16ToString(VolumeNameBuffer), nil
}

func getDosVolumeName(path string) (string, error) {
	kernel32, _ := syscall.LoadDLL("kernel32.dll")
	queryDosDeviceHandle, err := kernel32.FindProc("QueryDosDeviceW")
	if err != nil {
		return "", err
	}

	var VolumeNameBuffer = make([]uint16, syscall.MAX_PATH+1)
	var nVolumeNameSize = uint32(len(VolumeNameBuffer))

	ret, _, err := queryDosDeviceHandle.Call(
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(path))),
		uintptr(unsafe.Pointer(&VolumeNameBuffer[0])),
		uintptr(nVolumeNameSize))

	if ret == 0 {
		return "", err
	}

	return syscall.UTF16ToString(VolumeNameBuffer), nil

}

func isCdRom(path string) bool {
	if name, err := getDosVolumeName(path); err != nil {
		return strings.HasPrefix(strings.ToLower(name), "\\device\\cdrom")
	}
	return false
}

func getDriveLetters(startAtK bool) []string {
	i := uint(3)
	var drives []string
	if startAtK {
		i = 10
	}
	for ; i < 26; i++ {
		path := string(byte('A')+byte(i)) + ":"
		if isCdRom(path) {
			continue
		}
		volume, _ := getVolumeName(path)
		// sanity check that it isn't keybase already
		// Assume that no volume name means we can use it,
		// including errors retrieving same.
		// (we plan to change from KBFS to Keybase)
		if len(volume) > 0 && volume != "KBFS" && volume != "Keybase" {
			continue
		}
		drives = append(drives, path)
	}
	return drives
}

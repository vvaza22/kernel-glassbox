package model

import (
	"bridge/utils"
	"fmt"
)

const VMENumEntries = 512

const VMExplorerUnspecIndex int32 = -1

type VMEPath struct {
	L4 int32 `json:"l4"`
	L3 int32 `json:"l3"`
	L2 int32 `json:"l2"`
	L1 int32 `json:"l1"`
}

type NetlinkVMEntry struct {
	Value    uint64
	PA       uint64
	KernelVA uint64
	UserVA   uint64
	Size     uint64
	Present  bool
	Bad      bool
	Leaf     bool
	None     bool
}

func (e NetlinkVMEntry) String() string {
	return fmt.Sprintf("0x%016x [PA=0x%016x, KernelVA=0x%016x, UserVA=0x%016x]", e.Value, e.PA, e.KernelVA, e.UserVA)
}

func ReadNetlinkVMEntry(parser utils.ByteParser) (NetlinkVMEntry, error) {
	var entry NetlinkVMEntry

	entry.Value = parser.ReadUint64()
	entry.PA = parser.ReadUint64()
	entry.KernelVA = parser.ReadUint64()
	entry.UserVA = parser.ReadUint64()
	entry.Size = parser.ReadUint64()
	entry.Present = parser.ReadBool()
	entry.Bad = parser.ReadBool()
	entry.Leaf = parser.ReadBool()
	entry.None = parser.ReadBool()

	return entry, parser.Error()
}

type NetlinkVMEDump struct {
	Entries []NetlinkVMEntry
}

type WebsocketVMEntry struct {
	Index       int32  `json:"index"`
	RawValue    string `json:"rawValue"`
	PA          string `json:"pa"`
	KernelVA    string `json:"kernelVA"`
	UserVAStart string `json:"userVAStart"`
	UserVAEnd   string `json:"userVAEnd"`
	Size        string `json:"size"`
	Leaf        bool   `json:"leaf"`
	Present     bool   `json:"present"`
	None        bool   `json:"none"`
}

func ToWebsocketVMEntry(entry NetlinkVMEntry, index int) WebsocketVMEntry {
	return WebsocketVMEntry{
		Index:       int32(index),
		RawValue:    fmt.Sprintf("0x%016x", entry.Value),
		PA:          fmt.Sprintf("0x%016x", entry.PA),
		KernelVA:    fmt.Sprintf("0x%016x", entry.KernelVA),
		UserVAStart: fmt.Sprintf("0x%016x", entry.UserVA),
		UserVAEnd:   fmt.Sprintf("0x%016x", entry.UserVA+entry.Size),
		Size:        fmt.Sprintf("0x%016x", entry.Size),
		Leaf:        entry.Leaf,
		Present:     entry.Present,
		None:        entry.None,
	}
}

type WebsocketVMEReq struct {
	Key  TaskKey `json:"key"`
	Path VMEPath `json:"path"`
}

type WebsocketVMEDump struct {
	Entries []WebsocketVMEntry `json:"entries"`
}

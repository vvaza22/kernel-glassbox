package model

import (
	"bridge/utils"
	"fmt"
)

const VMENumEntries = 512

const VMExplorerUnspecIndex int32 = -1

type VMEPath struct {
	PGD int32
	PUD int32
	PMD int32
	PTE int32
}

type VMEntry struct {
	Value    uint64
	PA       uint64
	KernelVA uint64
	UserVA   uint64
	Present  bool
	Bad      bool
	Leaf     bool
}

func (e VMEntry) String() string {
	return fmt.Sprintf("0x%016x [PA=0x%016x, KernelVA=0x%016x, UserVA=0x%016x]", e.Value, e.PA, e.KernelVA, e.UserVA)
}

func ReadVMEntry(parser utils.ByteParser) (VMEntry, error) {
	var entry VMEntry

	entry.Value = parser.ReadUint64()
	entry.PA = parser.ReadUint64()
	entry.KernelVA = parser.ReadUint64()
	entry.UserVA = parser.ReadUint64()
	entry.Present = parser.ReadBool()
	entry.Bad = parser.ReadBool()
	entry.Leaf = parser.ReadBool()

	return entry, parser.Error()
}

type VMEDump struct {
	Entries []VMEntry
}

package model

import (
	"bridge/utils"
)

type CredData struct {
	Uid  uint32
	Gid  uint32
	Suid uint32
	Sgid uint32
	Euid uint32
	Egid uint32
}

func ReadCredData(parser utils.ByteParser) (CredData, error) {
	var creds CredData

	creds.Uid = parser.ReadUint32()
	creds.Gid = parser.ReadUint32()
	creds.Suid = parser.ReadUint32()
	creds.Sgid = parser.ReadUint32()
	creds.Euid = parser.ReadUint32()
	creds.Egid = parser.ReadUint32()

	return creds, parser.Error()
}

type SchedData struct {
	Prio           int32
	StaticPrio     int32
	NormalPrio     int32
	Vruntime       uint64
	SumExecRuntime uint64
}

func ReadSchedData(parser utils.ByteParser) (SchedData, error) {
	var sched SchedData

	sched.Prio = parser.ReadInt32()
	sched.StaticPrio = parser.ReadInt32()
	sched.NormalPrio = parser.ReadInt32()
	sched.Vruntime = parser.ReadUint64()
	sched.SumExecRuntime = parser.ReadUint64()

	return sched, parser.Error()
}

type MemoryData struct {
	MmapBase uint64
	TaskSize uint64

	// Page counts
	TotalVm  uint64
	LockedVm uint64
	DataVm   uint64
	ExecVm   uint64
	StackVm  uint64

	// Code segment
	StartCode uint64
	EndCode   uint64

	// Data segment
	StartData uint64
	EndData   uint64

	// Heap
	StartBrk uint64
	Brk      uint64

	// Stack
	StartStack uint64

	// Arguments
	ArgStart uint64
	ArgEnd   uint64

	// Environment
	EnvStart uint64
	EnvEnd   uint64
}

func ReadMemoryData(parser utils.ByteParser) (MemoryData, error) {
	var mem MemoryData

	mem.MmapBase = parser.ReadUint64()
	mem.TaskSize = parser.ReadUint64()

	mem.TotalVm = parser.ReadUint64()
	mem.LockedVm = parser.ReadUint64()
	mem.DataVm = parser.ReadUint64()
	mem.ExecVm = parser.ReadUint64()
	mem.StackVm = parser.ReadUint64()

	mem.StartCode = parser.ReadUint64()
	mem.EndCode = parser.ReadUint64()

	mem.StartData = parser.ReadUint64()
	mem.EndData = parser.ReadUint64()

	mem.StartBrk = parser.ReadUint64()
	mem.Brk = parser.ReadUint64()

	mem.StartStack = parser.ReadUint64()

	mem.ArgStart = parser.ReadUint64()
	mem.ArgEnd = parser.ReadUint64()

	mem.EnvStart = parser.ReadUint64()
	mem.EnvEnd = parser.ReadUint64()

	return mem, parser.Error()
}

type TaskviewData struct {
	// Identity
	Pid        uint32
	Tgid       uint32
	StartTime  uint64
	Comm       string
	Parent     TaskKey
	RealParent TaskKey

	// State
	State      uint32
	ExitState  int32
	ExitCode   int32
	ExitSignal int32

	// Security
	StackCanary uint64

	// Creds
	RealCreds CredData

	// Scheduler
	Sched SchedData

	// Memory
	Memory MemoryData
}

func ReadTaskviewData(parser utils.ByteParser) (TaskviewData, error) {
	var data TaskviewData

	// Identity
	data.Pid = parser.ReadUint32()
	data.Tgid = parser.ReadUint32()
	data.StartTime = parser.ReadUint64()
	data.Comm = parser.ReadString(16)
	data.Parent, _ = ReadTaskKey(parser)
	data.RealParent, _ = ReadTaskKey(parser)

	// State
	data.State = parser.ReadUint32()
	data.ExitState = parser.ReadInt32()
	data.ExitCode = parser.ReadInt32()
	data.ExitSignal = parser.ReadInt32()

	// Security
	data.StackCanary = parser.ReadUint64()

	// Creds
	data.RealCreds, _ = ReadCredData(parser)

	// Scheduler
	data.Sched, _ = ReadSchedData(parser)

	// Memory
	data.Memory, _ = ReadMemoryData(parser)

	return data, parser.Error()
}

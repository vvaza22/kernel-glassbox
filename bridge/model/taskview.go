package model

import (
	"bridge/utils"
	"fmt"
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

type WebsocketSchedData struct {
	Prio           string `json:"prio"`
	StaticPrio     string `json:"staticPrio"`
	NormalPrio     string `json:"normalPrio"`
	Vruntime       string `json:"vruntime"`
	SumExecRuntime string `json:"sumExecRuntime"`
}

func ToWebsocketSchedData(sched SchedData) WebsocketSchedData {
	return WebsocketSchedData{
		Prio:           fmt.Sprintf("%d", sched.Prio),
		StaticPrio:     fmt.Sprintf("%d", sched.StaticPrio),
		NormalPrio:     fmt.Sprintf("%d", sched.NormalPrio),
		Vruntime:       fmt.Sprintf("%d", sched.Vruntime),
		SumExecRuntime: fmt.Sprintf("%d", sched.SumExecRuntime),
	}
}

type WebsocketCredData struct {
	Uid  string `json:"uid"`
	Gid  string `json:"gid"`
	Suid string `json:"suid"`
	Sgid string `json:"sgid"`
	Euid string `json:"euid"`
	Egid string `json:"egid"`
}

func ToWebsocketCredData(creds CredData) WebsocketCredData {
	return WebsocketCredData{
		Uid:  fmt.Sprintf("%d", creds.Uid),
		Gid:  fmt.Sprintf("%d", creds.Gid),
		Suid: fmt.Sprintf("%d", creds.Suid),
		Sgid: fmt.Sprintf("%d", creds.Sgid),
		Euid: fmt.Sprintf("%d", creds.Euid),
		Egid: fmt.Sprintf("%d", creds.Egid),
	}
}

type WebsocketMemoryData struct {
	MmapBase string `json:"mmapBase"`
	TaskSize string `json:"taskSize"`

	// Page counts
	TotalVm  string `json:"totalVm"`
	LockedVm string `json:"lockedVm"`
	DataVm   string `json:"dataVm"`
	ExecVm   string `json:"execVm"`
	StackVm  string `json:"stackVm"`

	// Code segment
	StartCode string `json:"startCode"`
	EndCode   string `json:"endCode"`

	// Data segment
	StartData string `json:"startData"`
	EndData   string `json:"endData"`

	// Heap
	StartBrk string `json:"startBrk"`
	Brk      string `json:"brk"`

	// Stack
	StartStack string `json:"startStack"`

	// Arguments
	ArgStart string `json:"argStart"`
	ArgEnd   string `json:"argEnd"`

	// Environment
	EnvStart string `json:"envStart"`
	EnvEnd   string `json:"envEnd"`
}

func ToWebsocketMemoryData(mem MemoryData) WebsocketMemoryData {
	return WebsocketMemoryData{
		MmapBase:   fmt.Sprintf("0x%016x", mem.MmapBase),
		TaskSize:   fmt.Sprintf("0x%016x", mem.TaskSize),
		TotalVm:    fmt.Sprintf("0x%016x", mem.TotalVm),
		LockedVm:   fmt.Sprintf("0x%016x", mem.LockedVm),
		DataVm:     fmt.Sprintf("0x%016x", mem.DataVm),
		ExecVm:     fmt.Sprintf("0x%016x", mem.ExecVm),
		StackVm:    fmt.Sprintf("0x%016x", mem.StackVm),
		StartCode:  fmt.Sprintf("0x%016x", mem.StartCode),
		EndCode:    fmt.Sprintf("0x%016x", mem.EndCode),
		StartData:  fmt.Sprintf("0x%016x", mem.StartData),
		EndData:    fmt.Sprintf("0x%016x", mem.EndData),
		StartBrk:   fmt.Sprintf("0x%016x", mem.StartBrk),
		Brk:        fmt.Sprintf("0x%016x", mem.Brk),
		StartStack: fmt.Sprintf("0x%016x", mem.StartStack),
		ArgStart:   fmt.Sprintf("0x%016x", mem.ArgStart),
		ArgEnd:     fmt.Sprintf("0x%016x", mem.ArgEnd),
		EnvStart:   fmt.Sprintf("0x%016x", mem.EnvStart),
		EnvEnd:     fmt.Sprintf("0x%016x", mem.EnvEnd),
	}
}

type WebsocketTaskviewData struct {
	// Identity
	Pid        string  `json:"pid"`
	Tgid       string  `json:"tgid"`
	StartTime  string  `json:"startTime"`
	Comm       string  `json:"comm"`
	Parent     TaskKey `json:"parent"`
	RealParent TaskKey `json:"realParent"`

	// State
	State      string `json:"state"`
	ExitState  string `json:"exitState"`
	ExitCode   string `json:"exitCode"`
	ExitSignal string `json:"exitSignal"`

	// Security
	StackCanary string `json:"stackCanary"`

	// Creds
	RealCreds WebsocketCredData `json:"realCreds"`

	// Scheduler
	Sched WebsocketSchedData `json:"sched"`

	// Memory
	Memory WebsocketMemoryData `json:"memory"`
}

func ToWebsocketTaskviewData(data TaskviewData) WebsocketTaskviewData {
	return WebsocketTaskviewData{
		Pid:         fmt.Sprintf("%d", data.Pid),
		Tgid:        fmt.Sprintf("%d", data.Tgid),
		StartTime:   fmt.Sprintf("%d", data.StartTime),
		Comm:        data.Comm,
		Parent:      data.Parent,
		RealParent:  data.RealParent,
		State:       fmt.Sprintf("%d", data.State),
		ExitState:   fmt.Sprintf("%d", data.ExitState),
		ExitCode:    fmt.Sprintf("%d", data.ExitCode),
		ExitSignal:  fmt.Sprintf("%d", data.ExitSignal),
		StackCanary: fmt.Sprintf("0x%016x", data.StackCanary),
		RealCreds:   ToWebsocketCredData(data.RealCreds),
		Sched:       ToWebsocketSchedData(data.Sched),
		Memory:      ToWebsocketMemoryData(data.Memory),
	}
}

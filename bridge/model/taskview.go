package model

import (
	"bridge/utils"
	"fmt"
)

type TaskviewData struct {
	Pid       uint32
	Tgid      uint32
	StartTime uint64
	Name      string
	State     uint32
	Found     bool
}

func (d TaskviewData) String() string {
	return fmt.Sprintf("TaskviewData{Pid: %d, Tgid: %d, StartTime: %d, Name: %s, State: %d, Found: %t}", d.Pid, d.Tgid, d.StartTime, d.Name, d.State, d.Found)
}

func ReadTaskviewData(parser utils.ByteParser) (TaskviewData, error) {
	var data TaskviewData
	data.Pid = parser.ReadUint32()
	data.Tgid = parser.ReadUint32()
	data.StartTime = parser.ReadUint64()
	data.Name = parser.ReadString(16)
	data.State = parser.ReadUint32()
	data.Found = parser.ReadBool()
	return data, parser.Error()
}

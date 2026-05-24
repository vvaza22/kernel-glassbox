package model

import "bridge/utils"

type SchedSwitchData struct {
	Prev      TaskKey
	Next      TaskKey
	CommPrev  string
	CommNext  string
	Timestamp uint64
	Cpu       int32
}

func ReadSchedSwitchData(parser utils.ByteParser) (SchedSwitchData, error) {
	var data SchedSwitchData

	data.Prev, _ = ReadTaskKey(parser)
	data.Next, _ = ReadTaskKey(parser)
	data.CommPrev = parser.ReadString(16)
	data.CommNext = parser.ReadString(16)
	data.Timestamp = parser.ReadUint64()
	data.Cpu = parser.ReadInt32()

	return data, parser.Error()
}

type SchedCap struct {
	Data []SchedSwitchData
}

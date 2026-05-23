package model

import "bridge/utils"

type SchedSwitchData struct {
	Prev      TaskKey
	Next      TaskKey
	Timestamp uint64
	Cpu       int32
}

func ReadSchedSwitchData(parser utils.ByteParser) (SchedSwitchData, error) {
	var data SchedSwitchData

	data.Prev, _ = ReadTaskKey(parser)
	data.Next, _ = ReadTaskKey(parser)
	data.Timestamp = parser.ReadUint64()
	data.Cpu = parser.ReadInt32()

	return data, parser.Error()
}

type SchedCap struct {
	Data []SchedSwitchData
}

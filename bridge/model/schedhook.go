package model

import "bridge/utils"

type SchedEvent struct {
	Prev          TaskKey `json:"prev"`
	Next          TaskKey `json:"next"`
	CommPrev      string  `json:"commPrev"`
	CommNext      string  `json:"commNext"`
	Timestamp     uint64  `json:"timestamp"`
	CPU           int32   `json:"cpu"`
	PrevIsKthread bool    `json:"prevIsKthread"`
	NextIsKthread bool    `json:"nextIsKthread"`
}

func ReadSchedEvent(parser utils.ByteParser) (SchedEvent, error) {
	var data SchedEvent

	data.Prev, _ = ReadTaskKey(parser)
	data.Next, _ = ReadTaskKey(parser)
	data.CommPrev = parser.ReadString(16)
	data.CommNext = parser.ReadString(16)
	data.Timestamp = parser.ReadUint64()
	data.CPU = parser.ReadInt32()
	data.PrevIsKthread = parser.ReadBool()
	data.NextIsKthread = parser.ReadBool()

	return data, parser.Error()
}

type SchedCap struct {
	Events []SchedEvent `json:"events"`
}

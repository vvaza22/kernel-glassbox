package model

import (
	"bridge/utils"
	"fmt"
	"strconv"
)

type TaskKey struct {
	Pid       uint32 `json:"pid"`
	StartTime uint64 `json:"startTime"`
}

func (tk TaskKey) String() string {
	return fmt.Sprintf("(%d,%d)", tk.Pid, tk.StartTime)
}

func ReadTaskKey(parser utils.ByteParser) (TaskKey, error) {
	var tk TaskKey
	tk.Pid = parser.ReadUint32()
	parser.Padding(4)
	tk.StartTime = parser.ReadUint64()
	return tk, parser.Error()
}

type WebsocketTaskKey struct {
	Pid       string `json:"pid"`
	StartTime string `json:"startTime"`
}

func ToWebsocketTaskKey(tk TaskKey) WebsocketTaskKey {
	return WebsocketTaskKey{
		Pid:       fmt.Sprintf("%d", tk.Pid),
		StartTime: fmt.Sprintf("%d", tk.StartTime),
	}
}

func ToTaskKey(wsTaskKey WebsocketTaskKey) (TaskKey, error) {
	pid, err := strconv.ParseUint(wsTaskKey.Pid, 10, 32)
	if err != nil {
		return TaskKey{}, err
	}

	startTime, err := strconv.ParseUint(wsTaskKey.StartTime, 10, 64)
	if err != nil {
		return TaskKey{}, err
	}

	return TaskKey{
		Pid:       uint32(pid),
		StartTime: startTime,
	}, nil
}

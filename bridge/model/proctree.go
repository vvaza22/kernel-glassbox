package model

import (
	"bridge/utils"
	"fmt"
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

type ProctreeNode struct {
	Parent      TaskKey `json:"parent"`
	RealParent  TaskKey `json:"realParent"`
	GroupLeader TaskKey `json:"groupLeader"`
	Self        TaskKey `json:"self"`
	Name        string  `json:"name"`
}

func (n ProctreeNode) String() string {
	return fmt.Sprintf("ProctreeNode{Parent: %s, Self: %s, Name: %s}", n.Parent, n.Self, n.Name)
}

func ReadProctreeNode(parser utils.ByteParser) (ProctreeNode, error) {
	var node ProctreeNode

	node.Parent, _ = ReadTaskKey(parser)
	node.RealParent, _ = ReadTaskKey(parser)
	node.GroupLeader, _ = ReadTaskKey(parser)
	node.Self, _ = ReadTaskKey(parser)
	node.Name = parser.ReadString(16)

	return node, parser.Error()
}

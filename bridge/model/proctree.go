package model

import (
	"bridge/utils"
	"fmt"
)

type ProctreeNode struct {
	Parent      TaskKey `json:"parent"`
	RealParent  TaskKey `json:"realParent"`
	GroupLeader TaskKey `json:"groupLeader"`
	Self        TaskKey `json:"self"`
	Name        string  `json:"name"`
	IsKthread   bool    `json:"isKthread"`
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
	node.IsKthread = parser.ReadBool()

	return node, parser.Error()
}

type WebsocketProctreeNode struct {
	Parent      WebsocketTaskKey `json:"parent"`
	RealParent  WebsocketTaskKey `json:"realParent"`
	GroupLeader WebsocketTaskKey `json:"groupLeader"`
	Self        WebsocketTaskKey `json:"self"`
	Name        string           `json:"name"`
	IsKthread   bool             `json:"isKthread"`
}

func ToWebsocketProctreeNode(node ProctreeNode) WebsocketProctreeNode {
	return WebsocketProctreeNode{
		Parent:      ToWebsocketTaskKey(node.Parent),
		RealParent:  ToWebsocketTaskKey(node.RealParent),
		GroupLeader: ToWebsocketTaskKey(node.GroupLeader),
		Self:        ToWebsocketTaskKey(node.Self),
		Name:        node.Name,
		IsKthread:   node.IsKthread,
	}
}

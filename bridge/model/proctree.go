package model

import (
	"bytes"
	"encoding/binary"
	"fmt"
)

type TaskKey struct {
	Pid       uint32
	StartTime uint64
}

func (tk TaskKey) String() string {
	return fmt.Sprintf("(%d,%d)", tk.Pid, tk.StartTime)
}

type ProctreeNode struct {
	Parent TaskKey
	Self   TaskKey
	Name   string
}

func (n ProctreeNode) String() string {
	return fmt.Sprintf("ProctreeNode{Parent: %s, Self: %s, Name: %s}", n.Parent, n.Self, n.Name)
}

func ParseProctreeNode(data []byte) (ProctreeNode, error) {
	var node ProctreeNode

	if len(data) != 48 {
		return node, fmt.Errorf("invalid data length for ProctreeNode: expected 48 bytes, got %d", len(data))
	}

	node.Parent.Pid = binary.LittleEndian.Uint32(data[0:4])
	// Compiler pads 4 bytes to make the next field aligned to 8 bytes
	node.Parent.StartTime = binary.LittleEndian.Uint64(data[8:16])

	node.Self.Pid = binary.LittleEndian.Uint32(data[16:20])
	node.Self.StartTime = binary.LittleEndian.Uint64(data[24:32])

	node.Name = string(bytes.TrimRight(data[32:48], "\x00"))

	return node, nil
}

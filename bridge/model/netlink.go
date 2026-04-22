package model

import "github.com/mdlayher/genetlink"

const FamilyName = "GLASSBOX"

const (
	CmdUnspec = iota
	CmdProctreeDump
)

const (
	AttrUnspec = iota
	AttrProctreeNode
)

type NetlinkCtx struct {
	Conn   *genetlink.Conn
	Family genetlink.Family
}

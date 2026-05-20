package model

import "github.com/mdlayher/genetlink"

const FamilyName = "GLASSBOX"

const (
	CmdUnspec = iota

	// Proctree
	CmdProctreeDump

	// Taskview
	CmdTaskviewGet

	// VMExplorer
	CmdVMExplorerDump
)

const (
	AttrUnspec = iota

	// Proctree
	AttrProctreeNode

	// Taskview
	AttrTaskviewPid
	AttrTaskviewStartTime
	AttrTaskviewData

	// VMExplorer
	AttrVMExplorerPGD
	AttrVMExplorerPUD
	AttrVMExplorerPMD
	AttrVMExplorerPTE
	AttrVMExplorerPID
	AttrVMExplorerStartTime
	AttrVMExplorerEntry
)

type NetlinkCtx struct {
	Conn   *genetlink.Conn
	Family genetlink.Family
}

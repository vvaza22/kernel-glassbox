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

	// Schedhook
	CmdSchedhookCap
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

	// Schedhook
	AttrSchedhookData
	AttrSchedhookTimeLeft
	AttrSchedhookTotalCPUs
	AttrSchedhookDoneCPUs
	AttrSchedhookNumSwitches
)

type NetlinkCtx struct {
	Conn   *genetlink.Conn
	Family genetlink.Family
}

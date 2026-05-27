package nlclient_test

import (
	"bridge/model"
	"bridge/nlclient"
	"bridge/utils"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestVMExplorer(t *testing.T) {
	nl, err := nlclient.NewNetlinkClient()
	require.NoError(t, err)
	require.NotNil(t, nl)
	defer nl.Destroy()

	proc := nl.Proctree()
	vme := nl.VMExplorer()

	nodes, err := proc.Dump()
	require.NoError(t, err)
	require.NotEmpty(t, nodes)

	nodeMap := make(map[uint32]model.ProctreeNode)
	for _, node := range nodes {
		nodeMap[node.Self.Pid] = node
	}

	pid := os.Getpid()
	self, ok := nodeMap[uint32(pid)]
	require.True(t, ok)
	key := model.TaskKey{Pid: self.Self.Pid, StartTime: self.Self.StartTime}

	t.Run("dumps pgd entries", func(t *testing.T) {
		_, addr, unmap, err := utils.MmapPage()
		require.NoError(t, err)
		defer unmap()

		pgdIdx := utils.PGDI(addr)
		pudIdx := utils.PUDI(addr)
		pmdIdx := utils.PMDI(addr)
		pteIdx := utils.PTEI(addr)
		t.Logf("PAGE: 0x%016x (%d, %d, %d, %d)", addr, pgdIdx, pudIdx, pmdIdx, pteIdx)

		/* PGD Level */
		dump, err := vme.Dump(key, model.VMEPath{
			L4: model.VMExplorerUnspecIndex,
			L3: model.VMExplorerUnspecIndex,
			L2: model.VMExplorerUnspecIndex,
			L1: model.VMExplorerUnspecIndex,
		})
		require.NoError(t, err)
		require.NotNil(t, dump)
		require.NotEmpty(t, dump.Entries)
		require.Len(t, dump.Entries, model.VMENumEntries)

		printEntries(t, "PGD", dump.Entries)
		require.True(t, dump.Entries[pgdIdx].Present)

		/* PUD Level */
		dump, err = vme.Dump(key, model.VMEPath{
			L4: pgdIdx,
			L3: model.VMExplorerUnspecIndex,
			L2: model.VMExplorerUnspecIndex,
			L1: model.VMExplorerUnspecIndex,
		})
		require.NoError(t, err)
		require.NotNil(t, dump)
		require.NotEmpty(t, dump.Entries)
		require.Len(t, dump.Entries, model.VMENumEntries)

		printEntries(t, "PUD", dump.Entries)
		require.True(t, dump.Entries[pudIdx].Present)

		/* PMD Level */
		dump, err = vme.Dump(key, model.VMEPath{
			L4: pgdIdx,
			L3: pudIdx,
			L2: model.VMExplorerUnspecIndex,
			L1: model.VMExplorerUnspecIndex,
		})
		require.NoError(t, err)
		require.NotNil(t, dump)
		require.NotEmpty(t, dump.Entries)
		require.Len(t, dump.Entries, model.VMENumEntries)

		printEntries(t, "PMD", dump.Entries)
		require.True(t, dump.Entries[pmdIdx].Present)

		/* PTE Level */
		dump, err = vme.Dump(key, model.VMEPath{
			L4: pgdIdx,
			L3: pudIdx,
			L2: pmdIdx,
			L1: model.VMExplorerUnspecIndex,
		})
		require.NoError(t, err)
		require.NotNil(t, dump)
		require.NotEmpty(t, dump.Entries)
		require.Len(t, dump.Entries, model.VMENumEntries)

		printEntries(t, "PTE", dump.Entries)
		require.True(t, dump.Entries[pteIdx].Present)
		require.True(t, dump.Entries[pteIdx].Leaf)
		require.False(t, dump.Entries[pteIdx].Bad)
		require.Equal(t, addr, dump.Entries[pteIdx].UserVA)
	})

	t.Run("handles THP huge pages", func(t *testing.T) {
		_, addr, unmap, err := utils.MmapHugepageTHP()
		require.NoError(t, err)
		defer unmap()

		pgdIdx := utils.PGDI(addr)
		pudIdx := utils.PUDI(addr)
		pmdIdx := utils.PMDI(addr)
		t.Logf("HUGEPAGE: 0x%016x (%d, %d, %d)", addr, pgdIdx, pudIdx, pmdIdx)

		dump, err := vme.Dump(key, model.VMEPath{
			L4: pgdIdx,
			L3: pudIdx,
			L2: model.VMExplorerUnspecIndex,
			L1: model.VMExplorerUnspecIndex,
		})
		require.NoError(t, err)
		require.NotNil(t, dump)

		printEntries(t, "PMD (HUGEPAGE)", dump.Entries)
		require.True(t, dump.Entries[pmdIdx].Present)
		require.True(t, dump.Entries[pmdIdx].Leaf)
		require.Equal(t, addr, dump.Entries[pmdIdx].UserVA)
	})
}

func printEntries(t *testing.T, label string, entries []model.NetlinkVMEntry) {
	t.Helper()
	t.Logf("===================== %s =====================\n", label)
	for idx, entry := range entries {
		if !entry.Present {
			continue
		}
		t.Logf("%d: %s\n", idx, entry.String())
	}
}

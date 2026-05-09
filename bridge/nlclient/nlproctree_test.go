package nlclient_test

import (
	"bridge/model"
	"bridge/nlclient"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestProctreeClient(t *testing.T) {
	nl, err := nlclient.NewNetlinkClient()
	require.NoError(t, err)
	require.NotNil(t, nl)
	defer nl.Destroy()

	proctree := nl.Proctree()

	t.Run("dumps proctree", func(t *testing.T) {
		currentPid := os.Getpid()

		nodes, err := proctree.Dump()
		require.NoError(t, err)
		require.NotNil(t, nodes)
		require.NotEmpty(t, nodes)

		// Assumption: PIDs are unique within single dump
		nodeMap := make(map[uint32]model.ProctreeNode)
		for _, node := range nodes {
			nodeMap[node.Self.Pid] = node
		}
		require.Equal(t, len(nodes), len(nodeMap))

		// Sanity check: ensure it contains systemd and kthreadd
		systemdNode, ok := nodeMap[1]
		require.True(t, ok)
		require.Equal(t, "systemd", systemdNode.Name)
		require.Equal(t, uint32(1), systemdNode.Self.Pid)
		require.Greater(t, systemdNode.Self.StartTime, uint64(0))
		require.Equal(t, model.TaskKey{Pid: 0, StartTime: 0}, systemdNode.Parent)
		require.Equal(t, model.TaskKey{Pid: 0, StartTime: 0}, systemdNode.RealParent)
		// Systemd is the group leader itself
		require.Equal(t, model.TaskKey{Pid: 1, StartTime: systemdNode.Self.StartTime}, systemdNode.GroupLeader)

		kthreaddNode, ok := nodeMap[2]
		require.True(t, ok)
		require.Equal(t, "kthreadd", kthreaddNode.Name)
		require.Equal(t, uint32(2), kthreaddNode.Self.Pid)
		require.Greater(t, kthreaddNode.Self.StartTime, uint64(0))
		require.Equal(t, model.TaskKey{Pid: 0, StartTime: 0}, kthreaddNode.Parent)
		require.Equal(t, model.TaskKey{Pid: 0, StartTime: 0}, kthreaddNode.RealParent)
		require.Equal(t, model.TaskKey{Pid: 2, StartTime: kthreaddNode.Self.StartTime}, kthreaddNode.GroupLeader)

		// Sanity check: ensure it contains the current process
		require.Contains(t, nodeMap, uint32(currentPid))
	})

	t.Run("rapidly dumps proctree multiple times", func(t *testing.T) {
		for range 100 {
			nodes, err := proctree.Dump()
			require.NoError(t, err)
			require.NotNil(t, nodes)
			require.NotEmpty(t, nodes)
		}
	})
}

package nlclient_test

import (
	"bridge/model"
	"bridge/nlclient"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestTaskviewClient(t *testing.T) {
	nl, err := nlclient.NewNetlinkClient()
	require.NoError(t, err)
	require.NotNil(t, nl)
	defer nl.Destroy()

	proctree := nl.Proctree()
	taskview := nl.Taskview()

	t.Run("returns found false for non-existent key", func(t *testing.T) {
		// Wrong PID and StartTime
		taskviewData, err := taskview.Get(model.TaskKey{Pid: 1234567, StartTime: 0})
		require.NoError(t, err)
		require.NotNil(t, taskviewData)
		require.False(t, taskviewData.Found)

		// Correct PID but wrong StartTime
		taskviewData, err = taskview.Get(model.TaskKey{Pid: 1, StartTime: 1})
		require.NoError(t, err)
		require.NotNil(t, taskviewData)
		require.False(t, taskviewData.Found)
	})

	t.Run("gets taskview data", func(t *testing.T) {
		nodes, err := proctree.Dump()
		require.NoError(t, err)
		require.NotNil(t, nodes)
		require.NotEmpty(t, nodes)

		nodeMap := make(map[uint32]model.ProctreeNode)
		for _, node := range nodes {
			nodeMap[node.Self.Pid] = node
		}

		// Get taskview for systemd
		systemdNode, ok := nodeMap[1]
		require.True(t, ok)

		taskviewData, err := taskview.Get(systemdNode.Self)
		require.NoError(t, err)
		require.NotNil(t, taskviewData)
		require.True(t, taskviewData.Found)
		require.Equal(t, uint32(1), taskviewData.Pid)
		require.Equal(t, uint32(1), taskviewData.Tgid)
		require.Equal(t, systemdNode.Self.StartTime, taskviewData.StartTime)
		require.Equal(t, "systemd", taskviewData.Name)

		// Get taskview for kthreadd
		kthreadNode, ok := nodeMap[2]
		require.True(t, ok)

		taskviewData, err = taskview.Get(kthreadNode.Self)
		require.NoError(t, err)
		require.NotNil(t, taskviewData)
		require.True(t, taskviewData.Found)
		require.Equal(t, uint32(2), taskviewData.Pid)
		require.Equal(t, uint32(2), taskviewData.Tgid)
		require.Equal(t, kthreadNode.Self.StartTime, taskviewData.StartTime)
		require.Equal(t, "kthreadd", taskviewData.Name)
	})

	t.Run("rapidly gets taskview data for multiple processes", func(t *testing.T) {
		nodes, err := proctree.Dump()
		require.NoError(t, err)
		require.NotNil(t, nodes)
		require.NotEmpty(t, nodes)

		for _, node := range nodes {
			data, err := taskview.Get(node.Self)
			require.NoError(t, err)
			require.NotNil(t, data)
			require.True(t, data.Found)
			require.Equal(t, node.Self.Pid, data.Pid)
			require.Equal(t, node.GroupLeader.Pid, data.Tgid)
			require.Equal(t, node.Self.StartTime, data.StartTime)
			require.Equal(t, node.Name, data.Name)
		}

	})
}

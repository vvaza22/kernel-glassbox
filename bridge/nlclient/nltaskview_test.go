package nlclient_test

import (
	"bridge/model"
	"bridge/nlclient"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
)

const (
	numGetRequests = 100
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
		require.Error(t, err)
		require.ErrorIs(t, err, nlclient.ErrNoTaskFound)
		require.Nil(t, taskviewData)

		// Correct PID but wrong StartTime
		taskviewData, err = taskview.Get(model.TaskKey{Pid: 1, StartTime: 1})
		require.Error(t, err)
		require.ErrorIs(t, err, nlclient.ErrNoTaskFound)
		require.Nil(t, taskviewData)
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
		require.Equal(t, uint32(1), taskviewData.Pid)
		require.Equal(t, uint32(1), taskviewData.Tgid)
		require.Equal(t, systemdNode.Self.StartTime, taskviewData.StartTime)
		require.Equal(t, "systemd", taskviewData.Comm)

		// Get taskview for kthreadd
		kthreadNode, ok := nodeMap[2]
		require.True(t, ok)

		taskviewData, err = taskview.Get(kthreadNode.Self)
		require.NoError(t, err)
		require.NotNil(t, taskviewData)
		require.Equal(t, uint32(2), taskviewData.Pid)
		require.Equal(t, uint32(2), taskviewData.Tgid)
		require.Equal(t, kthreadNode.Self.StartTime, taskviewData.StartTime)
		require.Equal(t, "kthreadd", taskviewData.Comm)
	})

	t.Run("rapidly gets taskview data for multiple processes", func(t *testing.T) {
		nodes, err := proctree.Dump()
		require.NoError(t, err)
		require.NotNil(t, nodes)
		require.NotEmpty(t, nodes)

		for _, node := range nodes {
			data, err := taskview.Get(node.Self)
			require.NoError(t, err)
			require.NoError(t, verifyTaskviewData(data, node))
		}
	})

	t.Run("concurrently gets taskview data for multiple processes", func(t *testing.T) {
		nodes, err := proctree.Dump()
		require.NoError(t, err)
		require.NotNil(t, nodes)
		require.NotEmpty(t, nodes)

		var eg errgroup.Group
		for _, node := range nodes {
			cur := node
			eg.Go(func() error {
				for range numGetRequests {
					data, err := taskview.Get(cur.Self)
					if err != nil {
						return err
					}
					if err := verifyTaskviewData(data, cur); err != nil {
						return err
					}
				}
				return nil
			})
		}

		err = eg.Wait()
		require.NoError(t, err)
	})
}

func verifyTaskviewData(data *model.TaskviewData, node model.ProctreeNode) error {
	if data == nil {
		return errors.New("data is nil")
	}
	if data.Pid != node.Self.Pid {
		return errors.New("invalid pid")
	}
	if data.StartTime != node.Self.StartTime {
		return errors.New("invalid start time")
	}
	if data.Tgid != node.GroupLeader.Pid {
		return errors.New("invalid tgid")
	}
	if data.Comm != node.Name {
		return errors.New("invalid comm")
	}
	return nil
}

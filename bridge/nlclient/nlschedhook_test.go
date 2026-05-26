package nlclient_test

import (
	"bridge/model"
	"bridge/nlclient"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/pkg/errors"
	"github.com/stretchr/testify/require"
)

const (
	numStressTestGoroutines = 30
	numStressTestCaps       = 100
)

/* TODO: If some tests fail midway, might leave kernel state on cap start */

func TestSchedhookClient(t *testing.T) {
	nl, err := nlclient.NewNetlinkClient()
	require.NoError(t, err)
	require.NotNil(t, nl)
	defer nl.Destroy()

	schedhook := nl.Schedhook()

	t.Run("CapEnd fails if capture not started", func(t *testing.T) {
		data, err := schedhook.CapEnd()
		require.Error(t, err)
		require.ErrorIs(t, err, nlclient.ErrSchedhookNotStarted)
		require.Nil(t, data)
	})

	t.Run("CapStart fails if capture already started", func(t *testing.T) {
		err := schedhook.CapStart()
		require.NoError(t, err)

		err = schedhook.CapStart()
		require.Error(t, err)
		require.ErrorIs(t, err, nlclient.ErrSchedhookBusy)

		data, err := schedhook.CapEnd()
		require.NoError(t, err)
		require.NotNil(t, data)
	})

	t.Run("captures scheduler switches", func(t *testing.T) {
		err := schedhook.CapStart()
		require.NoError(t, err)

		time.Sleep(3 * time.Second)

		data, err := schedhook.CapEnd()
		require.NoError(t, err)
		require.NotNil(t, data)
		require.NotEmpty(t, data.Events)
		printEvents(t, data.Events)
	})

	t.Run("stress test sequential captures", func(t *testing.T) {
		for range numStressTestCaps {
			err := schedhook.CapStart()
			require.NoError(t, err)

			data, err := schedhook.CapEnd()
			require.NoError(t, err)
			require.NotNil(t, data)
		}

		// Make sure normal cap still works
		err := schedhook.CapStart()
		require.NoError(t, err)

		time.Sleep(1 * time.Second)

		data, err := schedhook.CapEnd()
		require.NoError(t, err)
		require.NotNil(t, data)
		require.NotEmpty(t, data.Events)
		printEvents(t, data.Events)
	})

	t.Run("stress test concurrent starts", func(t *testing.T) {
		var wg sync.WaitGroup
		var ok, busy atomic.Int32

		ok.Store(0)
		busy.Store(0)

		for range numStressTestGoroutines {
			wg.Go(func() {
				for range numStressTestCaps {
					err := schedhook.CapStart()
					if err != nil && errors.Is(err, nlclient.ErrSchedhookBusy) {
						busy.Add(1)
						continue
					} else if err == nil {
						ok.Add(1)
					}
				}
			})
		}

		wg.Wait()

		busyExpected := int32(numStressTestGoroutines*numStressTestCaps) - 1
		require.Equal(t, busyExpected, busy.Load())
		require.Equal(t, int32(1), ok.Load())

		data, err := schedhook.CapEnd()
		require.NoError(t, err)
		require.NotNil(t, data)
		printEvents(t, data.Events)
	})

	t.Run("stress test concurrent ends", func(t *testing.T) {
		var wg sync.WaitGroup
		var ok, notStarted atomic.Int32

		ok.Store(0)
		notStarted.Store(0)

		err := schedhook.CapStart()
		require.NoError(t, err)

		for range numStressTestGoroutines {
			wg.Go(func() {
				for range numStressTestCaps {
					_, err := schedhook.CapEnd()
					if err != nil && errors.Is(err, nlclient.ErrSchedhookNotStarted) {
						notStarted.Add(1)
					} else if err == nil {
						ok.Add(1)
					}
				}
			})
		}

		wg.Wait()

		notStartedExpected := int32(numStressTestGoroutines*numStressTestCaps) - 1
		require.Equal(t, notStartedExpected, notStarted.Load())
		require.Equal(t, int32(1), ok.Load())
	})

	t.Run("stress test concurrent starts and ends", func(t *testing.T) {
		var wgStart sync.WaitGroup
		var wgEnd sync.WaitGroup
		var startOk, startBusy, endOk, endNotStarted atomic.Int32

		startOk.Store(0)
		startBusy.Store(0)
		endOk.Store(0)
		endNotStarted.Store(0)

		for range numStressTestGoroutines {
			wgStart.Go(func() {
				for range numStressTestCaps {
					err := schedhook.CapStart()
					if err != nil && errors.Is(err, nlclient.ErrSchedhookBusy) {
						startBusy.Add(1)
					} else if err == nil {
						startOk.Add(1)
					}
				}
			})
			wgEnd.Go(func() {
				for range numStressTestCaps {
					_, err := schedhook.CapEnd()
					if err != nil && errors.Is(err, nlclient.ErrSchedhookNotStarted) {
						endNotStarted.Add(1)
					} else if err == nil {
						endOk.Add(1)
					}
				}
			})
		}

		wgStart.Wait()
		wgEnd.Wait()

		totalExpected := int32(numStressTestGoroutines * numStressTestCaps)
		require.Equal(t, totalExpected, startBusy.Load()+startOk.Load())
		require.Equal(t, totalExpected, endNotStarted.Load()+endOk.Load())

		// Reset state
		schedhook.CapEnd()

		// Make sure normal cap still works
		err := schedhook.CapStart()
		require.NoError(t, err)

		time.Sleep(1 * time.Second)

		data, err := schedhook.CapEnd()
		require.NoError(t, err)
		require.NotNil(t, data)
		require.NotEmpty(t, data.Events)
		printEvents(t, data.Events)
	})
}

func printEvents(t *testing.T, events []model.SchedEvent) {
	for _, event := range events {
		t.Logf("[%d] CPU=%d <%s>%s -> <%s>%s",
			event.Timestamp,
			event.CPU,
			event.CommPrev,
			event.Prev,
			event.CommNext,
			event.Next,
		)
	}
}

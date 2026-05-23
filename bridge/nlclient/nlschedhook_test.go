package nlclient_test

import (
	"bridge/model"
	"bridge/nlclient"
	"testing"

	"github.com/stretchr/testify/require"
)

const (
	numGoroutines = 30
	numCaptures   = 100
)

func TestSchedhookClient(t *testing.T) {
	nl, err := nlclient.NewNetlinkClient()
	require.NoError(t, err)
	require.NotNil(t, nl)
	defer nl.Destroy()

	schedhook := nl.Schedhook()

	t.Run("captures scheduler switches", func(t *testing.T) {
		data, err := schedhook.Cap()
		require.NoError(t, err)
		require.NotNil(t, data)
		require.NotEmpty(t, data.Data)
		printEvents(t, data.Data)
	})

	t.Run("run multiple captures sequentially", func(t *testing.T) {
		for range numCaptures {
			data, err := schedhook.Cap()
			require.NoError(t, err)
			require.NotNil(t, data)
			require.NotEmpty(t, data.Data)
		}
	})

	// t.Run("run multiple captures concurrently", func(t *testing.T) {
	// 	var wg sync.WaitGroup

	// 	for range numGoroutines {
	// 		wg.Go(func() {
	// 			for range numCaptures {
	// 				events, err := schedhook.Cap()
	// 				if err != nil {
	// 					require.Error(t, err, nlclient.ErrSchedhookCapBusy)
	// 					continue
	// 				}
	// 				require.NotNil(t, events)
	// 				require.NotEmpty(t, events.Data)
	// 			}
	// 		})
	// 	}

	// 	wg.Wait()

	// 	// Make sure normal capture still works
	// 	data, err := schedhook.Cap()
	// 	require.NoError(t, err)
	// 	require.NotNil(t, data)
	// 	require.NotEmpty(t, data.Data)
	// 	printEvents(t, data.Data)

	// })
}

func printEvents(t *testing.T, events []model.SchedSwitchData) {
	for _, event := range events {
		t.Logf("[%d] CPU=%d %s -> %s", event.Timestamp, event.Cpu, event.Prev, event.Next)
	}
}

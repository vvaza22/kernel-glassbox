package nlclient_test

import (
	"bridge/nlclient"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNetlinkClient(t *testing.T) {
	t.Run("single connection", func(t *testing.T) {
		nl, err := nlclient.NewNetlinkClient()
		require.NoError(t, err)
		require.NotNil(t, nl)

		err = nl.Destroy()
		require.NoError(t, err)
	})

	t.Run("multiple connections", func(t *testing.T) {
		nl1, err := nlclient.NewNetlinkClient()
		require.NoError(t, err)
		require.NotNil(t, nl1)

		nl2, err := nlclient.NewNetlinkClient()
		require.NoError(t, err)
		require.NotNil(t, nl2)

		err = nl1.Destroy()
		require.NoError(t, err)

		err = nl2.Destroy()
		require.NoError(t, err)
	})

	t.Run("rapid connect and destroy", func(t *testing.T) {
		for range 100 {
			nl, err := nlclient.NewNetlinkClient()
			require.NoError(t, err)
			require.NotNil(t, nl)

			err = nl.Destroy()
			require.NoError(t, err)
		}
	})
}

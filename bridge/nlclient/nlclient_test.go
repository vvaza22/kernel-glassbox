package nlclient_test

import (
	"bridge/nlclient"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNetlinkClient(t *testing.T) {
	t.Run("connect and destroy", func(t *testing.T) {
		nl, err := nlclient.NewNetlinkClient()
		require.NoError(t, err)
		require.NotNil(t, nl)

		err = nl.Destroy()
		require.NoError(t, err)
	})
}

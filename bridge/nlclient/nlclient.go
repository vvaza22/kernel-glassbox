package nlclient

import (
	"bridge/model"

	"github.com/mdlayher/genetlink"
	"github.com/pkg/errors"
)

type NetlinkClient interface {
	Proctree() ProctreeClient
	Destroy() error
}

type netlinkClient struct {
	conn           *genetlink.Conn
	family         genetlink.Family
	proctreeClient ProctreeClient
}

func NewNetlinkClient() (NetlinkClient, error) {
	conn, err := genetlink.Dial(nil)
	if err != nil {
		return nil, errors.Wrap(err, "could not initialize netlink connection")
	}

	family, err := conn.GetFamily(model.FamilyName)
	if err != nil {
		conn.Close()
		return nil, errors.Wrapf(err, "could not get family %s", model.FamilyName)
	}

	nlClient := &netlinkClient{
		conn:   conn,
		family: family,
	}

	nlClient.proctreeClient = NewProctreeClient(&model.NetlinkCtx{
		Conn:   conn,
		Family: family,
	})

	return nlClient, nil
}

func (c *netlinkClient) Proctree() ProctreeClient {
	return c.proctreeClient
}

func (c *netlinkClient) Destroy() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

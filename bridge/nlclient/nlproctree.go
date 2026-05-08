package nlclient

import (
	"bridge/model"
	"bridge/utils"

	"github.com/mdlayher/genetlink"
	"github.com/mdlayher/netlink"
)

type ProctreeClient interface {
	Dump() ([]model.ProctreeNode, error)
}

type proctreeClient struct {
	conn   *genetlink.Conn
	family genetlink.Family
}

func NewProctreeClient(ctx *model.NetlinkCtx) ProctreeClient {
	return &proctreeClient{
		conn:   ctx.Conn,
		family: ctx.Family,
	}
}

func (p *proctreeClient) Dump() ([]model.ProctreeNode, error) {
	var result []model.ProctreeNode

	req := genetlink.Message{
		Header: genetlink.Header{
			Command: model.CmdProctreeDump,
			Version: p.family.Version,
		},
	}

	msgs, err := p.conn.Execute(req, p.family.ID, netlink.Request|netlink.Dump)
	if err != nil {
		return nil, err
	}

	for _, msg := range msgs {
		batch, err := p.decodeDumpMessage(msg)
		if err != nil {
			return nil, err
		}
		result = append(result, batch...)
	}

	return result, nil
}

func (p *proctreeClient) decodeDumpMessage(msg genetlink.Message) ([]model.ProctreeNode, error) {
	var nodes []model.ProctreeNode

	attrDecoder, err := netlink.NewAttributeDecoder(msg.Data)
	if err != nil {
		return nil, err
	}

	for attrDecoder.Next() {
		if attrDecoder.Type() == model.AttrProctreeNode {
			parser := utils.NewByteParser(attrDecoder.Bytes())
			node, err := model.ReadProctreeNode(parser)
			if err != nil {
				return nil, err
			}
			nodes = append(nodes, node)
		}
	}

	if err := attrDecoder.Err(); err != nil {
		return nil, err
	}

	return nodes, nil
}

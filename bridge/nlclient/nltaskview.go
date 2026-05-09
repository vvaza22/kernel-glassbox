package nlclient

import (
	"bridge/model"
	"bridge/utils"
	"errors"

	"github.com/mdlayher/genetlink"
	"github.com/mdlayher/netlink"
)

var ErrNoMessagesReceived = errors.New("no messages received in response")
var ErrTooManyMessages = errors.New("too many messages received in response")
var ErrNoDataAttrReceived = errors.New("no data attribute received in response")

type TaskviewClient interface {
	Get(key model.TaskKey) (*model.TaskviewData, error)
}

type taskviewClient struct {
	conn   *genetlink.Conn
	family genetlink.Family
}

func NewTaskviewClient(ctx *model.NetlinkCtx) TaskviewClient {
	return &taskviewClient{
		conn:   ctx.Conn,
		family: ctx.Family,
	}
}

func (t *taskviewClient) Get(key model.TaskKey) (*model.TaskviewData, error) {
	encoder := netlink.NewAttributeEncoder()
	encoder.Uint32(model.AttrTaskviewPid, key.Pid)
	encoder.Uint64(model.AttrTaskviewStartTime, key.StartTime)
	payload, err := encoder.Encode()
	if err != nil {
		return nil, err
	}

	req := genetlink.Message{
		Header: genetlink.Header{
			Command: model.CmdTaskviewGet,
			Version: t.family.Version,
		},
		Data: payload,
	}

	msgs, err := t.conn.Execute(req, t.family.ID, netlink.Request)
	if err != nil {
		return nil, err
	}

	// Wait for exactly one message as a response
	if len(msgs) == 0 {
		return nil, ErrNoMessagesReceived
	}

	if len(msgs) > 1 {
		return nil, ErrTooManyMessages
	}

	msg := msgs[0]

	decoder, err := netlink.NewAttributeDecoder(msg.Data)
	if err != nil {
		return nil, err
	}

	for decoder.Next() {
		if decoder.Type() == model.AttrTaskviewData {
			parser := utils.NewByteParser(decoder.Bytes())
			data, err := model.ReadTaskviewData(parser)
			if err != nil {
				return nil, err
			}
			return &data, nil
		}
	}

	return nil, ErrNoDataAttrReceived
}

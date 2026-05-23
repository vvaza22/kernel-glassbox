package nlclient

import (
	"bridge/model"
	"bridge/utils"
	"errors"
	"sort"
	"syscall"

	"github.com/mdlayher/genetlink"
	"github.com/mdlayher/netlink"
)

var (
	ErrSchedhookCapBusy = errors.New("schedhook cap is busy")
)

type SchedhookClient interface {
	Cap() (*model.SchedCap, error)
}

type schedhookClient struct {
	conn   *genetlink.Conn
	family genetlink.Family
}

func NewSchedhookClient(ctx *model.NetlinkCtx) SchedhookClient {
	return &schedhookClient{
		conn:   ctx.Conn,
		family: ctx.Family,
	}
}

func (s *schedhookClient) Cap() (*model.SchedCap, error) {
	var events []model.SchedSwitchData

	req := genetlink.Message{
		Header: genetlink.Header{
			Command: model.CmdSchedhookCap,
			Version: s.family.Version,
		},
	}

	msgs, err := s.conn.Execute(req, s.family.ID, netlink.Request|netlink.Dump)
	if err != nil {
		if errors.Is(err, syscall.EBUSY) {
			return nil, ErrSchedhookCapBusy
		}
		return nil, err
	}

	for _, msg := range msgs {
		batch, err := s.decode(msg)
		if err != nil {
			return nil, err
		}
		events = append(events, batch...)
	}

	sort.Slice(events, func(i, j int) bool {
		return events[i].Timestamp < events[j].Timestamp
	})

	return &model.SchedCap{
		Data: events,
	}, nil
}

func (s *schedhookClient) decode(msg genetlink.Message) ([]model.SchedSwitchData, error) {
	var batch []model.SchedSwitchData

	decoder, err := netlink.NewAttributeDecoder(msg.Data)
	if err != nil {
		return nil, err
	}

	for decoder.Next() {
		if decoder.Type() == model.AttrSchedhookData {
			parser := utils.NewByteParser(decoder.Bytes())
			data, err := model.ReadSchedSwitchData(parser)
			if err != nil {
				return nil, err
			}
			batch = append(batch, data)
		}
	}

	if err := decoder.Err(); err != nil {
		return nil, err
	}

	return batch, nil
}

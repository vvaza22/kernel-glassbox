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
	ErrSchedhookBusy       = errors.New("schedhook cap is busy")
	ErrSchedhookNotStarted = errors.New("schedhook cap has not been started")
)

type SchedhookClient interface {
	CapStart() error
	CapEnd() (*model.SchedCap, error)
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

func (s *schedhookClient) CapStart() error {
	req := genetlink.Message{
		Header: genetlink.Header{
			Command: model.CmdSchedhookCapStart,
			Version: s.family.Version,
		},
	}

	_, err := s.conn.Execute(req, s.family.ID, netlink.Request)
	if err != nil {
		if errors.Is(err, syscall.EBUSY) {
			return ErrSchedhookBusy
		}
		return err
	}

	return nil
}

func (s *schedhookClient) CapEnd() (*model.SchedCap, error) {
	var events []model.SchedEvent

	req := genetlink.Message{
		Header: genetlink.Header{
			Command: model.CmdSchedhookCapEnd,
			Version: s.family.Version,
		},
	}

	msgs, err := s.conn.Execute(req, s.family.ID, netlink.Request|netlink.Dump)
	if err != nil {
		if errors.Is(err, syscall.EPERM) {
			return nil, ErrSchedhookNotStarted
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
		Events: events,
	}, nil
}

func (s *schedhookClient) decode(msg genetlink.Message) ([]model.SchedEvent, error) {
	var batch []model.SchedEvent

	decoder, err := netlink.NewAttributeDecoder(msg.Data)
	if err != nil {
		return nil, err
	}

	for decoder.Next() {
		if decoder.Type() == model.AttrSchedhookEvent {
			parser := utils.NewByteParser(decoder.Bytes())
			data, err := model.ReadSchedEvent(parser)
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

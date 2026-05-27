package nlclient

import (
	"bridge/model"
	"bridge/utils"

	"github.com/mdlayher/genetlink"
	"github.com/mdlayher/netlink"
)

type VMExplorerClient interface {
	Dump(key model.TaskKey, path model.VMEPath) (*model.NetlinkVMEDump, error)
}

type vmexplorerClient struct {
	conn   *genetlink.Conn
	family genetlink.Family
}

func NewVMExplorerClient(ctx *model.NetlinkCtx) VMExplorerClient {
	return &vmexplorerClient{
		conn:   ctx.Conn,
		family: ctx.Family,
	}
}

func (vc *vmexplorerClient) Dump(key model.TaskKey, path model.VMEPath) (*model.NetlinkVMEDump, error) {
	var entries []model.NetlinkVMEntry

	payload, err := vc.encode(key, path)
	if err != nil {
		return nil, err
	}

	req := genetlink.Message{
		Header: genetlink.Header{
			Command: model.CmdVMExplorerDump,
			Version: vc.family.Version,
		},
		Data: payload,
	}

	msgs, err := vc.conn.Execute(req, vc.family.ID, netlink.Request|netlink.Dump)
	if err != nil {
		return nil, err
	}

	for _, msg := range msgs {
		batch, err := vc.decode(msg)
		if err != nil {
			return nil, err
		}
		entries = append(entries, batch...)
	}

	return &model.NetlinkVMEDump{
		Entries: entries,
	}, nil
}

func (vc *vmexplorerClient) encode(key model.TaskKey, path model.VMEPath) ([]byte, error) {
	encoder := netlink.NewAttributeEncoder()
	encoder.Uint32(model.AttrVMExplorerPID, key.Pid)
	encoder.Uint64(model.AttrVMExplorerStartTime, key.StartTime)
	encoder.Int32(model.AttrVMExplorerPGD, path.L4)
	encoder.Int32(model.AttrVMExplorerPUD, path.L3)
	encoder.Int32(model.AttrVMExplorerPMD, path.L2)
	encoder.Int32(model.AttrVMExplorerPTE, path.L1)
	return encoder.Encode()
}

func (vc *vmexplorerClient) decode(msg genetlink.Message) ([]model.NetlinkVMEntry, error) {
	var entries []model.NetlinkVMEntry

	decoder, err := netlink.NewAttributeDecoder(msg.Data)
	if err != nil {
		return nil, err
	}

	for decoder.Next() {
		if decoder.Type() == model.AttrVMExplorerEntry {
			parser := utils.NewByteParser(decoder.Bytes())
			entry, err := model.ReadNetlinkVMEntry(parser)
			if err != nil {
				return nil, err
			}
			entries = append(entries, entry)
		}
	}

	if err := decoder.Err(); err != nil {
		return nil, err
	}

	return entries, nil
}

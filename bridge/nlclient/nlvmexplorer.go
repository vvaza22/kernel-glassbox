package nlclient

import (
	"bridge/model"
	"bridge/utils"

	"github.com/mdlayher/genetlink"
	"github.com/mdlayher/netlink"
)

type VMExplorerClient interface {
	Dump(key model.TaskKey, path model.VMEPath) (*model.VMEDump, error)
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

func (vc *vmexplorerClient) Dump(key model.TaskKey, path model.VMEPath) (*model.VMEDump, error) {
	var entries []model.VMEntry

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

	return &model.VMEDump{
		Entries: entries,
	}, nil
}

func (vc *vmexplorerClient) encode(key model.TaskKey, path model.VMEPath) ([]byte, error) {
	encoder := netlink.NewAttributeEncoder()
	encoder.Uint32(model.AttrVMExplorerPID, key.Pid)
	encoder.Uint64(model.AttrVMExplorerStartTime, key.StartTime)
	encoder.Int32(model.AttrVMExplorerPGD, path.PGD)
	encoder.Int32(model.AttrVMExplorerPUD, path.PUD)
	encoder.Int32(model.AttrVMExplorerPMD, path.PMD)
	encoder.Int32(model.AttrVMExplorerPTE, path.PTE)
	return encoder.Encode()
}

func (vc *vmexplorerClient) decode(msg genetlink.Message) ([]model.VMEntry, error) {
	var entries []model.VMEntry

	decoder, err := netlink.NewAttributeDecoder(msg.Data)
	if err != nil {
		return nil, err
	}

	for decoder.Next() {
		if decoder.Type() == model.AttrVMExplorerEntry {
			parser := utils.NewByteParser(decoder.Bytes())
			entry, err := model.ReadVMEntry(parser)
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

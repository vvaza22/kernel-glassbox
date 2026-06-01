package app

import (
	"bridge/model"
	"bridge/utils"
	"encoding/json"
	"fmt"
)

type ClientMessageListener interface {
	ID() string
	OnClientMessage(msg model.WSMessage)
}

type Handler interface {
	ID() string
	OnClientMessage(msg model.WSMessage)
	Destroy()
}

type handler struct {
	id string
	// Ownership of the write channel is transferred to the handler
	writeCh chan<- model.WSMessage

	proctree  ProctreeManager
	schedhook SchedhookManager
	vme       VMExplorerManager
}

type HandlerParams struct {
	Proctree  ProctreeManager
	Schedhook SchedhookManager
	VME       VMExplorerManager
}

func NewHandler(ctx *model.WSContext, params *HandlerParams) Handler {
	return &handler{
		id:        utils.UID(),
		writeCh:   ctx.WriteCh,
		proctree:  params.Proctree,
		schedhook: params.Schedhook,
		vme:       params.VME,
	}
}

func (h *handler) ID() string {
	return h.id
}

func (h *handler) OnClientMessage(msg model.WSMessage) {
	fmt.Printf("Received message from client %s: %v\n", h.id, msg)
	switch msg.Type {
	case model.WSMsgClientReqProctreeDump:
		h.handleProctreeDump()
	case model.WSMSgClientReqSchedhookCapStart:
		h.handleCapStart()
	case model.WSMsgClientReqSchedhookCapEnd:
		h.handleCapEnd()
	case model.WSMsgClientReqVMEDump:
		req := model.WebsocketVMEReq{}
		err := json.Unmarshal(msg.Payload, &req)
		if err != nil {
			// TODO: Send error message back to client
			return
		}
		h.handleVMEDump(req)
	default:
	}
}

func (h *handler) handleVMEDump(req model.WebsocketVMEReq) {
	entries, err := h.vme.Explore(req.Key, req.Path)
	if err != nil {
		// TODO: Send error message back to client
		return
	}
	respMsg, err := model.NewWSMsg(model.WSMsgSrvVMEDump, &model.WebsocketVMEDump{
		Entries: entries,
	})
	if err != nil {
		return
	}
	h.sendMessage(respMsg)
}

func (h *handler) handleCapStart() {
	err := h.schedhook.Start()
	if err != nil {
		// TODO: Send error
		return
	}
}

func (h *handler) handleCapEnd() {
	cap, err := h.schedhook.End()
	if err != nil {
		// TODO: Send error
		return
	}
	respMsg, err := model.NewWSMsg(model.WSMsgSrvSchedhookCap, cap)
	if err != nil {
		return
	}
	h.sendMessage(respMsg)
}

func (h *handler) handleProctreeDump() {
	nodes, err := h.proctree.Dump()
	if err != nil {
		// TODO: Log the error and send an error message back to the client
		return
	}
	respMsg, err := model.NewWSMsg(model.WSMsgSrvProctreeDump, nodes)
	if err != nil {
		return
	}
	h.sendMessage(respMsg)
}

func (h *handler) sendMessage(msg model.WSMessage) {
	select {
	case h.writeCh <- msg:
	default:
		// TODO: Log a warning about dropped message
	}
}

func (h *handler) Destroy() {
	close(h.writeCh)
}

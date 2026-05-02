package app

import (
	"bridge/model"
	"bridge/nlclient"
	"bridge/utils"
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
	nl      nlclient.NetlinkClient
}

func NewHandler(ctx *model.WSContext, nl nlclient.NetlinkClient) Handler {
	return &handler{
		id:      utils.UID(),
		writeCh: ctx.WriteCh,
		nl:      nl,
	}
}

func (h *handler) ID() string {
	return h.id
}

func (h *handler) OnClientMessage(msg model.WSMessage) {
	fmt.Printf("Received message from client %s: %v\n", h.id, msg)
	switch msg.Type {
	case model.WSMsgClientReqProctreeDump:
		h.handleProctreeDumpRequest()
	}
}

func (h *handler) handleProctreeDumpRequest() {
	proctreeClient := h.nl.Proctree()
	nodes, err := proctreeClient.Dump()
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

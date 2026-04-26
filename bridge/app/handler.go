package app

import (
	"bridge/model"
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
}

func NewHandler(ctx *model.WSContext) Handler {
	return &handler{
		id:      utils.UID(),
		writeCh: ctx.WriteCh,
	}
}

func (h *handler) ID() string {
	return h.id
}

func (h *handler) OnClientMessage(msg model.WSMessage) {
	fmt.Printf("Received message from client %s: %v\n", h.id, msg)
}

func (h *handler) Destroy() {
	close(h.writeCh)
}

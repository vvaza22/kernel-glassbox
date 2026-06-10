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
	taskview  TaskviewManager
}

type HandlerParams struct {
	Proctree  ProctreeManager
	Schedhook SchedhookManager
	VME       VMExplorerManager
	Taskview  TaskviewManager
}

func NewHandler(ctx *model.WSContext, params *HandlerParams) Handler {
	return &handler{
		id:        utils.UID(),
		writeCh:   ctx.WriteCh,
		proctree:  params.Proctree,
		schedhook: params.Schedhook,
		vme:       params.VME,
		taskview:  params.Taskview,
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
			fmt.Printf("Invalid VME dump request")
			return
		}
		h.handleVMEDump(req)
	case model.WSMsgClientReqTaskview:
		req := model.WebsocketTaskKey{}
		if err := json.Unmarshal(msg.Payload, &req); err != nil {
			fmt.Printf("Invalid task view request")
			return
		}
		h.handleTaskView(req)
	default:
	}
}

func (h *handler) handleVMEDump(req model.WebsocketVMEReq) {
	entries, err := h.vme.Explore(req.Key, req.Path)
	if err != nil {
		h.sendError("VME Explore failed")
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
		h.sendError("Capture Start Failed")
		return
	}
}

func (h *handler) handleCapEnd() {
	cap, err := h.schedhook.End()
	if err != nil {
		h.sendError("Capture End Failed")
		return
	}
	respMsg, err := model.NewWSMsg(model.WSMsgSrvSchedhookCap, cap)
	if err != nil {
		return
	}
	h.sendMessage(respMsg)
}

func (h *handler) handleProctreeDump() {
	err := h.proctree.Register(h.id, h)
	if err != nil {
		h.sendError("Failed to subscribe to Proctree updates")
		return
	}
}

func (h *handler) OnProctreeDump(dump *model.WebsocketProctreeDump) {
	respMsg, err := model.NewWSMsg(model.WSMsgSrvProctreeDump, dump)
	if err != nil {
		return
	}
	h.sendMessage(respMsg)
}

func (h *handler) handleTaskView(key model.WebsocketTaskKey) {
	data, err := h.taskview.View(key)
	if err != nil {
		return
	}
	respMsg, err := model.NewWSMsg(model.WSMsgSrvTaskviewData, data)
	if err != nil {
		return
	}
	h.sendMessage(respMsg)
}

func (h *handler) sendMessage(msg model.WSMessage) {
	select {
	case h.writeCh <- msg:
	default:
		fmt.Printf("Failed to send message to client %s", h.id)
	}
}

func (h *handler) sendError(msg string) {
	errMsg, err := model.NewWSMsg(model.WSMsgSrvError, &model.WebsocketError{
		Message: msg,
	})
	if err != nil {
		return
	}
	h.sendMessage(errMsg)
}

func (h *handler) Destroy() {
	close(h.writeCh)
	h.proctree.Unregister(h.id)
}

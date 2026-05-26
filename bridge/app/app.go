package app

import (
	"bridge/model"
	"bridge/nlclient"
	"sync"
)

type App interface {
	AddClient(ctx *model.WSContext) ClientMessageListener
	RemoveClient(clientID string)
}

type app struct {
	mu      sync.RWMutex
	clients map[string]Handler

	nlClient         nlclient.NetlinkClient
	proctreeManager  ProctreeManager
	schedhookManager SchedhookManager
}

func NewApp(nl nlclient.NetlinkClient) App {
	return &app{
		clients:          make(map[string]Handler),
		nlClient:         nl,
		proctreeManager:  NewProctreeManager(nl.Proctree()),
		schedhookManager: NewSchedhookManager(nl.Schedhook()),
	}
}

func (a *app) AddClient(wsCtx *model.WSContext) ClientMessageListener {
	a.mu.Lock()
	defer a.mu.Unlock()

	handler := NewHandler(wsCtx, &HandlerParams{
		Proctree:  a.proctreeManager,
		Schedhook: a.schedhookManager,
	})
	a.clients[handler.ID()] = handler

	return handler
}

func (a *app) RemoveClient(clientID string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	handler, exists := a.clients[clientID]
	if !exists {
		return
	}

	handler.Destroy()
	delete(a.clients, clientID)
}

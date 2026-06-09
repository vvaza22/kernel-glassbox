package app

import (
	"bridge/model"
	"bridge/nlclient"
	"sync"
)

type App interface {
	AddClient(ctx *model.WSContext) ClientMessageListener
	RemoveClient(clientID string)
	Destroy()
}

type app struct {
	mu      sync.RWMutex
	clients map[string]Handler

	nlClient         nlclient.NetlinkClient
	proctreeManager  ProctreeManager
	schedhookManager SchedhookManager
	vmeManager       VMExplorerManager
	taskviewManager  TaskviewManager
}

func NewApp(nl nlclient.NetlinkClient) App {
	return &app{
		clients:          make(map[string]Handler),
		nlClient:         nl,
		proctreeManager:  NewProctreeManager(nl.Proctree()),
		schedhookManager: NewSchedhookManager(nl.Schedhook()),
		vmeManager:       NewVMExplorerManager(nl.VMExplorer()),
		taskviewManager:  NewTaskviewManager(nl.Taskview()),
	}
}

func (a *app) AddClient(wsCtx *model.WSContext) ClientMessageListener {
	a.mu.Lock()
	defer a.mu.Unlock()

	handler := NewHandler(wsCtx, &HandlerParams{
		Proctree:  a.proctreeManager,
		Schedhook: a.schedhookManager,
		VME:       a.vmeManager,
		Taskview:  a.taskviewManager,
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

func (a *app) Destroy() {
	a.mu.Lock()
	defer a.mu.Unlock()

	for _, handler := range a.clients {
		handler.Destroy()
	}
	a.clients = make(map[string]Handler)

	a.proctreeManager.Destroy()
}

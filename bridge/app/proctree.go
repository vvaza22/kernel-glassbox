package app

import (
	"bridge/model"
	"bridge/nlclient"
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

const DumpInterval = 3 * time.Second

type ProctreeDumpListener interface {
	OnProctreeDump(dump *model.WebsocketProctreeDump)
}

type ProctreeManager interface {
	Register(id string, listener ProctreeDumpListener) error
	Unregister(id string) error
	Destroy()
}

type proctreeManager struct {
	mu             sync.Mutex
	proctreeClient nlclient.ProctreeClient
	listeners      map[string]ProctreeDumpListener
	running        atomic.Bool
	wg             sync.WaitGroup
}

func NewProctreeManager(proctreeClient nlclient.ProctreeClient) ProctreeManager {
	pm := &proctreeManager{
		proctreeClient: proctreeClient,
		listeners:      make(map[string]ProctreeDumpListener),
	}
	pm.running.Store(true)
	pm.wg.Go(pm.dumpLoop)
	return pm
}

func (pm *proctreeManager) Register(id string, listener ProctreeDumpListener) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if _, exists := pm.listeners[id]; exists {
		return fmt.Errorf("listener %s is already registered", id)
	}
	pm.listeners[id] = listener

	return nil
}

func (pm *proctreeManager) Unregister(id string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if _, exists := pm.listeners[id]; !exists {
		return fmt.Errorf("listener %s is not registered", id)
	}
	delete(pm.listeners, id)

	return nil
}

func (pm *proctreeManager) Destroy() {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.listeners = make(map[string]ProctreeDumpListener)
	pm.running.Store(false)
	pm.wg.Wait()
}

func (pm *proctreeManager) dumpLoop() {
	for pm.running.Load() {
		dump, err := pm.dump()
		// TODO: Log the errors
		if err == nil {
			pm.notifyAll(dump)
		}
		time.Sleep(DumpInterval)
	}
}

func (pm *proctreeManager) notifyAll(dump *model.WebsocketProctreeDump) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	for _, listener := range pm.listeners {
		listener.OnProctreeDump(dump)
	}
}

func (pm *proctreeManager) dump() (*model.WebsocketProctreeDump, error) {
	nodes, err := pm.proctreeClient.Dump()
	if err != nil {
		return nil, err
	}

	wsNodes := make([]model.WebsocketProctreeNode, len(nodes))
	for i, node := range nodes {
		wsNodes[i] = model.ToWebsocketProctreeNode(node)
	}

	timeFormatted := time.Now().Format("2006-01-02 15:04:05.000000000")
	return &model.WebsocketProctreeDump{
		Nodes:         wsNodes,
		TimeFormatted: timeFormatted,
	}, nil
}

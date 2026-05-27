package app

import (
	"bridge/model"
	"bridge/nlclient"
)

type VMExplorerManager interface {
	Explore(key model.TaskKey, path model.VMEPath) ([]model.WebsocketVMEntry, error)
}

type vmExplorerManager struct {
	vmeClient nlclient.VMExplorerClient
}

func NewVMExplorerManager(vmeClient nlclient.VMExplorerClient) VMExplorerManager {
	return &vmExplorerManager{
		vmeClient: vmeClient,
	}
}

func (m *vmExplorerManager) Explore(key model.TaskKey, path model.VMEPath) ([]model.WebsocketVMEntry, error) {
	result := make([]model.WebsocketVMEntry, 0)

	dump, err := m.vmeClient.Dump(key, path)
	if err != nil {
		return nil, err
	}

	for index, entry := range dump.Entries {
		result = append(result, model.ToWebsocketVMEntry(entry, index))
	}

	return result, nil
}

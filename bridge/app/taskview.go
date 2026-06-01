package app

import (
	"bridge/model"
	"bridge/nlclient"
)

type TaskviewManager interface {
	View(key model.TaskKey) (*model.WebsocketTaskviewData, error)
}

type taskviewManager struct {
	taskviewClient nlclient.TaskviewClient
}

func NewTaskviewManager(taskviewClient nlclient.TaskviewClient) TaskviewManager {
	return &taskviewManager{
		taskviewClient: taskviewClient,
	}
}

func (m *taskviewManager) View(key model.TaskKey) (*model.WebsocketTaskviewData, error) {
	data, err := m.taskviewClient.Get(key)
	if err != nil {
		return nil, err
	}
	wsData := model.ToWebsocketTaskviewData(*data)
	return &wsData, nil
}

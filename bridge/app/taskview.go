package app

import (
	"bridge/model"
	"bridge/nlclient"
)

type TaskviewManager interface {
	View(wsKey model.WebsocketTaskKey) (*model.WebsocketTaskviewData, error)
}

type taskviewManager struct {
	taskviewClient nlclient.TaskviewClient
}

func NewTaskviewManager(taskviewClient nlclient.TaskviewClient) TaskviewManager {
	return &taskviewManager{
		taskviewClient: taskviewClient,
	}
}

func (m *taskviewManager) View(wsKey model.WebsocketTaskKey) (*model.WebsocketTaskviewData, error) {
	key, err := model.ToTaskKey(wsKey)
	if err != nil {
		return nil, err
	}

	data, err := m.taskviewClient.Get(key)
	if err != nil {
		return nil, err
	}
	wsData := model.ToWebsocketTaskviewData(*data)
	return &wsData, nil
}

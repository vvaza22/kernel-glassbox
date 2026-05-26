package app

import (
	"bridge/model"
	"bridge/nlclient"

	"github.com/pkg/errors"
)

type SchedhookManager interface {
	Start() error
	End() (*model.SchedCap, error)
}

type schedhookManager struct {
	schedhookClient nlclient.SchedhookClient
}

func NewSchedhookManager(schedhookClient nlclient.SchedhookClient) SchedhookManager {
	return &schedhookManager{
		schedhookClient: schedhookClient,
	}
}

func (m *schedhookManager) Start() error {
	err := m.schedhookClient.CapStart()
	if err != nil {
		return errors.Wrap(err, "failed to start capture")
	}
	return nil
}

func (m *schedhookManager) End() (*model.SchedCap, error) {
	cap, err := m.schedhookClient.CapEnd()
	if err != nil {
		return nil, errors.Wrap(err, "failed to end capture")
	}
	return cap, nil
}

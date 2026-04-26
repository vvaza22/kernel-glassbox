package app

import (
	"bridge/model"
	"bridge/nlclient"
)

type ProctreeManager interface {
	Dump() ([]model.ProctreeNode, error)
}

type proctreeManager struct {
	proctreeClient nlclient.ProctreeClient
}

func NewProctreeManager(proctreeClient nlclient.ProctreeClient) ProctreeManager {
	return &proctreeManager{
		proctreeClient: proctreeClient,
	}
}

func (pm *proctreeManager) Dump() ([]model.ProctreeNode, error) {
	return pm.proctreeClient.Dump()
}

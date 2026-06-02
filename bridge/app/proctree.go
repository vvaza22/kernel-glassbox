package app

import (
	"bridge/model"
	"bridge/nlclient"
)

type ProctreeManager interface {
	Dump() ([]model.WebsocketProctreeNode, error)
}

type proctreeManager struct {
	proctreeClient nlclient.ProctreeClient
}

func NewProctreeManager(proctreeClient nlclient.ProctreeClient) ProctreeManager {
	return &proctreeManager{
		proctreeClient: proctreeClient,
	}
}

func (pm *proctreeManager) Dump() ([]model.WebsocketProctreeNode, error) {
	nodes, err := pm.proctreeClient.Dump()
	if err != nil {
		return nil, err
	}

	wsNodes := make([]model.WebsocketProctreeNode, len(nodes))
	for i, node := range nodes {
		wsNodes[i] = model.ToWebsocketProctreeNode(node)
	}

	return wsNodes, nil
}

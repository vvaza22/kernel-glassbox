package model

import "encoding/json"

type WSMsgType uint32

// Server => Client messages [1, 1000]
const (
	WSMsgSrvError WSMsgType = iota + 1
	WSMsgSrvProctreeDump
	WSMsgSrvSchedhookCap
	WSMsgSrvVMEDump
)

// Client => Server messages [1001, +inf]
const (
	WSMsgClientReqProctreeDump WSMsgType = iota + 1001
	WSMSgClientReqSchedhookCapStart
	WSMsgClientReqSchedhookCapEnd
	WSMsgClientReqVMEDump
)

func NewWSMsg(msgType WSMsgType, payload any) (WSMessage, error) {
	msg := WSMessage{
		Type:    msgType,
		Payload: nil,
	}

	if payload == nil {
		return msg, nil
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return WSMessage{}, err
	}
	msg.Payload = payloadBytes

	return msg, nil
}

type WSMessage struct {
	Type    WSMsgType       `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

const WSChannelBufferSize = 1000

type WSContext struct {
	WriteCh chan<- WSMessage
}

package model

type Client struct {
	ID      string
	ReadCh  chan WSMessage
	WriteCh chan WSMessage
}

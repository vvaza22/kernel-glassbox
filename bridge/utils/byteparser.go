package utils

import (
	"bytes"
	"encoding/binary"
	"errors"
)

var ErrOutOfBounds = errors.New("can not read beyond the end of data")

type ByteParser interface {
	Padding(length uint)
	ReadUint32() uint32
	ReadUint64() uint64
	ReadString(length uint) string
	Error() error
}

type byteParser struct {
	data []byte
	pos  uint
	err  error
}

func NewByteParser(data []byte) ByteParser {
	return &byteParser{data: data, pos: 0}
}

func (bp *byteParser) read(length uint) []byte {
	if bp.err != nil {
		return nil
	}
	if bp.pos+length > uint(len(bp.data)) {
		bp.err = ErrOutOfBounds
		return nil
	}
	slice := bp.data[bp.pos : bp.pos+length]
	bp.pos += length
	return slice
}

func (bp *byteParser) ReadUint32() uint32 {
	slice := bp.read(4)
	if slice == nil {
		return 0
	}
	return binary.LittleEndian.Uint32(slice)
}

func (bp *byteParser) ReadUint64() uint64 {
	slice := bp.read(8)
	if slice == nil {
		return 0
	}
	return binary.LittleEndian.Uint64(slice)
}

func (bp *byteParser) ReadString(length uint) string {
	slice := bp.read(length)
	if slice == nil {
		return ""
	}
	if idx := bytes.IndexByte(slice, 0); idx != -1 {
		slice = slice[:idx]
	}
	return string(slice)
}

func (bp *byteParser) Padding(length uint) {
	bp.read(length)
}

func (bp *byteParser) Error() error {
	return bp.err
}

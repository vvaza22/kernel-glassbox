package app

import "fmt"

type Logger interface {
	Debugf(format string, args ...any)
	Errorf(format string, args ...any)
}

// TODO: This is just a simple wrapper, need to improve in the future
type logger struct{}

func NewLogger() Logger {
	return &logger{}
}

func (l *logger) Debugf(format string, args ...any) {
	fmt.Printf(format, args...)
}

func (l *logger) Errorf(format string, args ...any) {
	fmt.Printf(format, args...)
}

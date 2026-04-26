export enum LogLevel {
  DEBUG = 0,
  INFO,
  WARN,
  ERROR,
}

export type LoggerContextType = {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

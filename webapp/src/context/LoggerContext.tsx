import { createContext, useContext, useMemo } from "react";
import { LogLevel } from "../types/logger";
import type { LoggerContextType } from "../types/logger";

const LoggerContext = createContext<LoggerContextType | null>(null);

const getTimestamp = () => new Date().toISOString();

export const LoggerProvider: React.FC<{
  logLevel: LogLevel;
  children: React.ReactNode;
}> = ({ logLevel, children }) => {
  const logger = useMemo(
    () => ({
      debug: (...args: any[]) => {
        if (LogLevel.DEBUG >= logLevel) {
          console.debug(`${getTimestamp()} [DEBUG]`, ...args);
        }
      },
      info: (...args: any[]) => {
        if (LogLevel.INFO >= logLevel) {
          console.info(`${getTimestamp()} [INFO]`, ...args);
        }
      },
      warn: (...args: any[]) => {
        if (LogLevel.WARN >= logLevel) {
          console.warn(`${getTimestamp()} [WARN]`, ...args);
        }
      },
      error: (...args: any[]) => {
        if (LogLevel.ERROR >= logLevel) {
          console.error(`${getTimestamp()} [ERROR]`, ...args);
        }
      },
    }),
    [logLevel],
  );

  return (
    <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>
  );
};

export const useLogger = () => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error("useLogger must be used within a LoggerProvider");
  }
  return context;
};

import { LOG_LEVEL } from "@/config/config";
import { LogLevel } from "@/types/logger";

const getTimestamp = () => new Date().toISOString();

export const debug = (...args: any[]) => {
  if (LOG_LEVEL > LogLevel.DEBUG) return;
  console.debug(`${getTimestamp()} [DEBUG]`, ...args);
};

export const info = (...args: any[]) => {
  if (LOG_LEVEL > LogLevel.INFO) return;
  console.info(`${getTimestamp()} [INFO]`, ...args);
};

export const warn = (...args: any[]) => {
  if (LOG_LEVEL > LogLevel.WARN) return;
  console.warn(`${getTimestamp()} [WARN]`, ...args);
};

export const error = (...args: any[]) => {
  if (LOG_LEVEL > LogLevel.ERROR) return;
  console.error(`${getTimestamp()} [ERROR]`, ...args);
};

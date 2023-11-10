import { LogLevel } from "./log-level";

export type ProxyLogData = {
  level: LogLevel;
  source: string;
  message: string;
  loggerId: string;
  data?: Record<string, unknown>;
};

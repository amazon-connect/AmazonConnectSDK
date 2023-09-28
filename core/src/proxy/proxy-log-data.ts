import { LogLevel } from "../logging";

export type ProxyLogData = {
  level: LogLevel;
  source: string;
  message: string;
  loggerId: string;
  data?: Record<string, unknown>;
};

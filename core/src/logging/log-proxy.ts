import { ProxyLogData } from "./proxy-log-data";

export interface LogProxy {
  log({ level, source, message, loggerId, data }: ProxyLogData): void;
}

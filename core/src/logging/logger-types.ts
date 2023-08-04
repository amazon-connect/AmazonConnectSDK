import { AmazonConnectProvider } from "../provider";
import { LogLevel } from "./log-level";

export type ConnectLogData = Record<string, unknown>;
export type ConnectLoggerMixin = (
  data: ConnectLogData,
  level: LogLevel
) => ConnectLogData;

type BaseLoggerParams = {
  source: string;
  mixin?: ConnectLoggerMixin;
  options?: LoggerOptions;
};

export type ConnectLoggerFromContextParams = string | BaseLoggerParams;

export type ConnectLoggerParams = BaseLoggerParams & {
  provider?: AmazonConnectProvider;
};

export type LogEntryOptions = {
  duplicateMessageToConsole?: boolean;
  remoteIgnore?: boolean;
};

export type LoggerOptions = {
  minLogToConsoleLevelOverride?: LogLevel;
  remoteIgnore?: boolean;
};

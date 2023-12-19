import { LogLevel } from "./log-level";
import { LogProvider } from "./log-provider";

export type ConnectLogData = Record<string, unknown>;
export type ConnectLoggerMixin = (
  data: ConnectLogData,
  level: LogLevel,
) => ConnectLogData;

type BaseLoggerParams = {
  source: string;
  mixin?: ConnectLoggerMixin;
  options?: LoggerOptions;
};

export type ConnectLoggerFromContextParams = string | BaseLoggerParams;

export type ConnectLoggerParams = BaseLoggerParams & {
  provider?: LogProvider | (() => LogProvider);
};

export type LogEntryOptions = {
  duplicateMessageToConsole?: boolean;
  remoteIgnore?: boolean;
};

export type LoggerOptions = {
  minLogToConsoleLevelOverride?: LogLevel;
  remoteIgnore?: boolean;
};

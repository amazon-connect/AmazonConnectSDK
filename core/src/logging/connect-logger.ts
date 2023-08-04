import { AmazonConnectProvider, getGlobalProvider } from "../provider";
import { Proxy } from "../proxy";
import { generateStringId } from "../utility";
import { logToConsole } from "./log-data-console-writer";
import { LogDataTransformer } from "./log-data-transformer";
import { LogLevel } from "./log-level";
import {
  ConnectLogData,
  ConnectLoggerParams,
  LogEntryOptions,
  LoggerOptions,
} from "./logger-types";

export class ConnectLogger {
  private readonly provider: AmazonConnectProvider | undefined;
  private readonly source: string;
  private readonly loggerId: string;
  private readonly dataTransformer: LogDataTransformer;
  private readonly logOptions: LoggerOptions | undefined;
  private _proxy: Proxy | null;
  private _logToConsoleLevel: LogLevel | null;

  constructor(param: string | ConnectLoggerParams) {
    this._proxy = null;
    this._logToConsoleLevel = null;

    this.loggerId = generateStringId(8);
    if (typeof param === "string") {
      this.source = param;
      this.dataTransformer = new LogDataTransformer(undefined);
    } else {
      this.source = param.source;
      this.provider = param.provider;
      this.dataTransformer = new LogDataTransformer(param.mixin);
      this.logOptions = param.options;
    }
  }

  trace(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions
  ): void {
    this.log(LogLevel.trace, message, data, options);
  }

  debug(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions
  ): void {
    this.log(LogLevel.debug, message, data, options);
  }

  info(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions
  ): void {
    this.log(LogLevel.info, message, data, options);
  }

  warn(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions
  ): void {
    this.log(LogLevel.warn, message, data, options);
  }

  error(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions
  ): void {
    this.log(LogLevel.error, message, data, options);
  }

  log(
    level: LogLevel,
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions
  ): void {
    const transformedData = this.dataTransformer.getTransformedData(
      level,
      data
    );

    if (!this.ignoreRemote(options)) {
      this.getProxy().log({
        level,
        source: this.source,
        loggerId: this.loggerId,
        message,
        data: transformedData,
      });
    }

    if (this.applyDuplicateMessageToConsole(level, options)) {
      logToConsole(level, message, transformedData);
    }
  }

  private getProvider(): AmazonConnectProvider {
    if (this.provider) return this.provider;
    else return getGlobalProvider();
  }

  private getProxy(): Proxy {
    if (!this._proxy) {
      this._proxy = this.getProvider().getProxy();
    }
    return this._proxy;
  }

  private applyDuplicateMessageToConsole(
    level: LogLevel,
    options: LogEntryOptions | undefined
  ): boolean {
    return (
      options?.duplicateMessageToConsole || this.getLogConsoleLevel() <= level
    );
  }

  private getLogConsoleLevel(): LogLevel {
    if (!this._logToConsoleLevel) {
      this._logToConsoleLevel = this.logOptions?.minLogToConsoleLevelOverride
        ? this.logOptions.minLogToConsoleLevelOverride
        : this.getProvider().config?.logging?.minLogToConsoleLevel ??
          LogLevel.error;
    }

    return this._logToConsoleLevel;
  }

  private ignoreRemote(options: LogEntryOptions | undefined): boolean {
    return (
      (this.logOptions?.remoteIgnore ?? false) ||
      (options?.remoteIgnore ?? false)
    );
  }
}

import { getGlobalProvider } from "../provider";
import { generateStringId } from "../utility";
import { logToConsole } from "./log-data-console-writer";
import { LogDataTransformer } from "./log-data-transformer";
import { LogLevel } from "./log-level";
import { LogProvider } from "./log-provider";
import { LogProxy } from "./log-proxy";
import {
  ConnectLogData,
  ConnectLoggerParams,
  LogEntryOptions,
  LoggerOptions,
} from "./logger-types";

export class ConnectLogger {
  private provider: LogProvider | undefined;
  private readonly source: string;
  private readonly loggerId: string;
  private readonly dataTransformer: LogDataTransformer;
  private readonly logOptions: LoggerOptions | undefined;
  private _proxy: LogProxy | null;
  private _logToConsoleLevel: LogLevel | null;
  private readonly providerFactory: (() => LogProvider) | undefined;

  constructor(param: string | ConnectLoggerParams) {
    this._proxy = null;
    this._logToConsoleLevel = null;

    this.loggerId = generateStringId(8);
    if (typeof param === "string") {
      this.source = param;
      this.dataTransformer = new LogDataTransformer(undefined);
    } else {
      this.source = param.source;

      if (param.provider && typeof param.provider === "function")
        this.providerFactory = param.provider;
      else this.provider = param.provider;

      this.dataTransformer = new LogDataTransformer(param.mixin);
      this.logOptions = param.options;
    }
  }

  trace(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions,
  ): void {
    this.log(LogLevel.trace, message, data, options);
  }

  debug(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions,
  ): void {
    this.log(LogLevel.debug, message, data, options);
  }

  info(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions,
  ): void {
    this.log(LogLevel.info, message, data, options);
  }

  warn(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions,
  ): void {
    this.log(LogLevel.warn, message, data, options);
  }

  error(
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions,
  ): void {
    this.log(LogLevel.error, message, data, options);
  }

  log(
    level: LogLevel,
    message: string,
    data?: ConnectLogData,
    options?: LogEntryOptions,
  ): void {
    const transformedData = this.dataTransformer.getTransformedData(
      level,
      data,
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

  private getProvider(): LogProvider {
    if (!this.provider) {
      this.provider = this.providerFactory
        ? this.providerFactory()
        : getGlobalProvider();
    }

    return this.provider;
  }

  private getProxy(): LogProxy {
    if (!this._proxy) {
      this._proxy = this.getProvider().getProxy();
    }
    return this._proxy;
  }

  private applyDuplicateMessageToConsole(
    level: LogLevel,
    options: LogEntryOptions | undefined,
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

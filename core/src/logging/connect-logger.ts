import { Context } from "../context";
import { AmazonConnectProvider } from "../provider";
import { Proxy } from "../proxy";
import { generateStringId } from "../utility";
import { LogLevel } from "./log-level";
import {
  ConnectLogData,
  ConnectLoggerMixin,
  ConnectLoggerParams as ConnectLoggerParams,
  LogOptions,
} from "./logger-types";

export class ConnectLogger {
  private readonly provider: AmazonConnectProvider | undefined;
  private readonly source: string;
  private readonly loggerId: string;
  private readonly mixin: ConnectLoggerMixin | undefined;
  private readonly logOptions: LogOptions | undefined;
  private _proxy: Proxy | null;
  private _logToConsoleLevel: LogLevel | null;

  constructor(param: string | ConnectLoggerParams) {
    this._proxy = null;
    this._logToConsoleLevel = null;
    this.loggerId = generateStringId(8);
    if (typeof param === "string") {
      this.source = param;
    } else {
      this.source = param.source;
      this.provider = param.provider;
      this.mixin = param.mixin;
      this.logOptions = param.options;
    }
  }

  trace(message: string, data?: ConnectLogData, options?: LogOptions): void {
    this.log(LogLevel.trace, message, data, options);
  }

  debug(message: string, data?: ConnectLogData, options?: LogOptions): void {
    this.log(LogLevel.debug, message, data, options);
  }

  info(message: string, data?: ConnectLogData, options?: LogOptions): void {
    this.log(LogLevel.info, message, data, options);
  }

  warn(message: string, data?: ConnectLogData, options?: LogOptions): void {
    this.log(LogLevel.warn, message, data, options);
  }

  error(message: string, data?: ConnectLogData, options?: LogOptions): void {
    this.log(LogLevel.error, message, data, options);
  }

  log(
    level: LogLevel,
    message: string,
    data?: ConnectLogData,
    options?: LogOptions
  ): void {
    this.getProxy().log({
      level,
      source: this.source,
      loggerId: this.loggerId,
      message,
      data: this.getTransformedData(level, data),
    });

    if (this.applyDuplicateMessageToConsole(level, options)) {
      ConnectLogger.logToConsole(level, message, data);
    }
  }

  private getTransformedData(
    level: LogLevel,
    data?: ConnectLogData
  ): ConnectLogData | undefined {
    if (!this.mixin) {
      return data;
    }

    return {
      ...(data ?? {}),
      ...this.mixin(data ?? {}, level),
    };
  }

  private getProxy(): Proxy {
    if (!this._proxy) {
      this._proxy = new Context(this.provider).getProxy();
    }
    return this._proxy;
  }

  private applyDuplicateMessageToConsole(
    level: LogLevel,
    options: LogOptions | undefined
  ): boolean {
    return (
      options?.duplicateMessageToConsole ||
      this.logOptions?.duplicateMessageToConsole ||
      this.getLogConsoleLevel() >= level
    );
  }

  private getLogConsoleLevel(): LogLevel {
    if (!this._logToConsoleLevel) {
      this._logToConsoleLevel =
        this.provider?.config?.logging?.minLogToConsoleLevel ?? LogLevel.error;
    }

    return this._logToConsoleLevel;
  }

  private static logToConsole(
    level: LogLevel,
    message: string,
    data?: LogOptions
  ) {
    switch (level) {
      case LogLevel.error:
        console.error(message, data);
        break;
      case LogLevel.warn:
        console.warn(message, data);
        break;
      case LogLevel.info:
        console.info(message, data);
        break;
      case LogLevel.debug:
        console.debug(message, data);
        break;
      case LogLevel.trace:
        console.trace(message, data);
        break;
      default:
        console.log(message, data);
        break;
    }
  }
}

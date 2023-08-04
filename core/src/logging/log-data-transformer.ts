import { LogLevel } from "./log-level";
import { ConnectLogData, ConnectLoggerMixin } from "./logger-types";

export class LogDataTransformer {
  private readonly mixin: ConnectLoggerMixin | undefined;

  constructor(mixin: ConnectLoggerMixin | undefined) {
    this.mixin = mixin;
  }

  getTransformedData(
    level: LogLevel,
    data: ConnectLogData | undefined
  ): ConnectLogData | undefined {
    if (!this.mixin) return data;

    return {
      ...(data ?? {}),
      ...this.mixin(data ?? {}, level),
    };
  }
}

import { ConnectLogger, LogProvider } from "../../logging";
import {
  HealthCheckMessage,
  HealthCheckResponseMessage,
  UpstreamMessageOrigin,
} from "../../messaging";
import { AsyncEventEmitter } from "../../utility";
import { HealthCheckStatus } from "./health-check-status";
import {
  HealthCheckStatusChanged,
  HealthCheckStatusChangedHandler,
} from "./health-check-status-changed";

export type HealthCheckManagerParams = {
  provider: LogProvider;
  sendHealthCheck: (message: HealthCheckMessage) => void;
  getUpstreamMessageOrigin: () => UpstreamMessageOrigin;
};

type HealthCheckResult = { time: number; counter: number };

export class HealthCheckManager {
  private readonly logger: ConnectLogger;
  private readonly sendHealthCheck: (message: HealthCheckMessage) => void;
  private readonly getUpstreamMessageOrigin: () => UpstreamMessageOrigin;
  private _status: HealthCheckStatus;
  private lastHealthCheckResponse: HealthCheckResult | null;

  private readonly events: AsyncEventEmitter<HealthCheckStatusChanged>;
  private connectionId: string | null;
  private healthCheckInterval: number | null;

  private static readonly statusChangedKey = "statusChanged";

  private sendHealthCheckInterval: NodeJS.Timeout | null;
  private healthCheckTimeout: NodeJS.Timeout | null;

  constructor({
    provider,
    sendHealthCheck,
    getUpstreamMessageOrigin,
  }: HealthCheckManagerParams) {
    this.connectionId = null;
    this.healthCheckInterval = null;
    this.healthCheckTimeout = null;
    this.sendHealthCheck = sendHealthCheck;
    this.getUpstreamMessageOrigin = getUpstreamMessageOrigin;
    this.sendHealthCheckInterval = null;
    this.lastHealthCheckResponse = null;
    this._status = "unknown";

    this.logger = new ConnectLogger({
      source: "core.proxy.health-check",
      provider: provider,
      mixin: () => ({
        connectionId: this.connectionId,
      }),
    });

    this.events = new AsyncEventEmitter({
      provider,
      loggerKey: "core.proxy.health-check",
    });
  }

  get status(): HealthCheckStatus {
    return this._status;
  }

  get isRunning(): boolean {
    return this.sendHealthCheckInterval !== null;
  }

  get lastCheckCounter(): number | null {
    return this.lastHealthCheckResponse?.counter ?? null;
  }

  get lastCheckTime(): number | null {
    return this.lastHealthCheckResponse?.time ?? null;
  }

  start({
    healthCheckInterval: interval,
    connectionId,
  }: {
    healthCheckInterval: number;
    connectionId: string;
  }): void {
    this.connectionId = connectionId;
    this.healthCheckInterval = interval;
    this.clearInterval();

    if (interval <= 0) {
      this.logger.debug("Health check disabled");
      return;
    }

    if (interval < 1000) {
      this.logger.error(
        "Health check interval is less than 1 second. Not running",
        { interval },
      );

      return;
    }

    this.sendHealthCheckMessage();
    this.sendHealthCheckInterval = setInterval(
      () => this.sendHealthCheckMessage(),
      interval,
    );
    this.startTimeout();
  }

  stop(): void {
    this.clearInterval();
    this.clearTimeout();
  }

  handleResponse(message: HealthCheckResponseMessage): void {
    this.setHealthy({
      time: message.time,
      counter: message.counter,
    });
  }

  private sendHealthCheckMessage(): void {
    this.sendHealthCheck({
      type: "healthCheck",
      messageOrigin: this.getUpstreamMessageOrigin(),
    });
  }

  private startTimeout(): void {
    if (!this.healthCheckInterval) {
      this.logger.error("Health check interval not set. Cannot start timeout");
      return;
    }

    // Cancels a preexisting timeout to be replaced with new timeout
    this.clearTimeout();

    this.healthCheckTimeout = setTimeout(() => {
      this.setUnhealthy();
    }, this.healthCheckInterval * 3);
  }

  private clearInterval(): void {
    if (this.sendHealthCheckInterval) {
      clearInterval(this.sendHealthCheckInterval);
      this.sendHealthCheckInterval = null;
    }
  }

  private clearTimeout(): void {
    if (this.healthCheckTimeout) {
      clearTimeout(this.healthCheckTimeout);
      this.healthCheckTimeout = null;
    }
  }

  private setUnhealthy(): void {
    if (this._status !== "unhealthy") {
      const previousStatus = this._status;
      this.logger.info("Connection unhealthy", {
        previousStatus,
      });
      this._status = "unhealthy";

      this.emitStatusChanged("unhealthy", previousStatus);
    }
  }

  private setHealthy(result: HealthCheckResult): void {
    this.lastHealthCheckResponse = { ...result };

    if (this._status !== "healthy") {
      const previousStatus = this._status;
      this.logger.debug("Connection healthy", {
        previousStatus,
      });
      this._status = "healthy";

      this.emitStatusChanged("healthy", previousStatus);
    }

    this.startTimeout();
  }

  private emitStatusChanged(
    status: Exclude<HealthCheckStatus, "unknown">,
    previousStatus: HealthCheckStatus,
  ): void {
    void this.events.emit(HealthCheckManager.statusChangedKey, {
      status,
      previousStatus,
      lastCheckTime: this.lastHealthCheckResponse?.time ?? null,
      lastCheckCounter: this.lastHealthCheckResponse?.counter ?? null,
    });
  }

  onStatusChanged(handler: HealthCheckStatusChangedHandler): void {
    this.events.on(HealthCheckManager.statusChangedKey, handler);
  }

  offStatusChanged(handler: HealthCheckStatusChangedHandler): void {
    this.events.off(HealthCheckManager.statusChangedKey, handler);
  }
}

import {
  ConnectClient,
  ConnectClientConfig,
  ConnectLogger,
} from "@amazon-connect/core";

import { debugNamespace } from "../debug-namespace";
import { pingRoute } from "../routes";
import {
  connectivityPulseResetRoute,
  connectivityPulseStartRoute,
  connectivityPulseStopRoute,
} from "./connectivity-test-routes";
import {
  pulseHeartbeatKey,
  pulseStatusKey,
} from "./connectivity-test-topic-keys";

export type PingResponse = { message: string; time: Date };
export type ConnectivityPulseStatusChange =
  | { enabled: false }
  | { enabled: true; interval: number };
export type ConnectivityHeartbeatMessage = { count: number; time: Date };
export type ConnectivityPulseStatusChangeHandler = (
  msg: ConnectivityPulseStatusChange,
) => Promise<void>;
export type ConnectivityPulseHeartbeatHandler = (
  msg: ConnectivityHeartbeatMessage,
) => Promise<void>;

export class ConnectivityTestClient extends ConnectClient {
  private readonly logger: ConnectLogger;
  constructor(config?: ConnectClientConfig) {
    super(debugNamespace, config);

    this.logger = this.context.createLogger({
      source: "debug.connectivityTestClient",
    });
  }

  async sendPing(): Promise<PingResponse> {
    try {
      return await this.context.proxy.request(pingRoute);
    } catch (err) {
      this.logger.error("An error occurred when sending a ping", { err });
      return {} as PingResponse;
    }
  }

  async startPulse(intervalSeconds?: number): Promise<{ enabled: boolean }> {
    try {
      return await this.context.proxy.request(connectivityPulseStartRoute, {
        intervalSeconds,
      });
    } catch (err) {
      this.logger.error("An error occurred when starting pulse", { err });
      return { enabled: false };
    }
  }

  async stopPulse(): Promise<{ enabled: boolean }> {
    try {
      return await this.context.proxy.request(connectivityPulseStopRoute);
    } catch (err) {
      this.logger.error("An error occurred when stopping pulse", { err });
      return { enabled: false };
    }
  }

  async resetPulse(): Promise<{ enabled: boolean }> {
    try {
      return await this.context.proxy.request(connectivityPulseResetRoute);
    } catch (err) {
      this.logger.error("An error occurred resetting pulse", { err });
      return { enabled: false };
    }
  }

  onConnectivityPulseStatusChange(
    handler: ConnectivityPulseStatusChangeHandler,
  ): void {
    this.context.proxy.subscribe({ key: pulseStatusKey }, handler);
  }

  offConnectivityPulseStatusChange(
    handler: ConnectivityPulseStatusChangeHandler,
  ): void {
    this.context.proxy.unsubscribe({ key: pulseStatusKey }, handler);
  }

  onHeartbeat(handler: ConnectivityPulseHeartbeatHandler): void {
    this.context.proxy.subscribe({ key: pulseHeartbeatKey }, handler);
  }

  offHeartbeat(handler: ConnectivityPulseHeartbeatHandler): void {
    this.context.proxy.unsubscribe({ key: pulseHeartbeatKey }, handler);
  }
}

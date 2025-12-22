import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";

import { ComponentState, CurrentState } from "../component-state";
import { StateChangeResult } from "../types";
import {
  HostStateManagerClient,
  HostStateManagerClientConstructor,
} from "./host-state-manager-client";

export interface HostStateManagerParams {
  provider: AmazonConnectProvider;
  instanceId: string;
  connectionId: string;
  config: { name: string; arn: string };
  hostStateManagerClient: HostStateManagerClientConstructor;
}

export class HostStateManager {
  readonly instanceId: string;
  readonly connectionId: string;

  readonly provider: AmazonConnectProvider;

  private readonly hostStateManager: HostStateManagerClient;
  private readonly logger: ConnectLogger;

  constructor({
    provider,
    instanceId,
    connectionId,
    config,
    hostStateManagerClient,
  }: HostStateManagerParams) {
    this.instanceId = instanceId;
    this.connectionId = connectionId;
    this.provider = provider;
    this.hostStateManager = new hostStateManagerClient({ provider });

    this.logger = new ConnectLogger({
      source: "workspace.host",
      provider: provider,
      mixin: () => ({
        instanceId: this.instanceId,
        appName: config.name,
        arn: config.arn,
        connectionId: this.connectionId,
      }),
    });
  }

  async getState(): Promise<CurrentState> {
    try {
      return await this.hostStateManager.getState(this.instanceId);
    } catch (error) {
      this.logger.error("Error when attempting to get app state", { error });
      throw error;
    }
  }

  async updateState(
    state: ComponentState,
    omitLogMessages = false,
  ): Promise<StateChangeResult> {
    try {
      const result = await this.hostStateManager.updateState(
        this.instanceId,
        state,
      );

      if (result.success) {
        if (!omitLogMessages) {
          this.logger.info("App State Updated", {
            ...result,
          });
        }
      } else if (
        result.reason != "isCurrentState" &&
        result.reason !== "staleRequest"
      ) {
        // Failure because is current state or stale requests
        // can be ignored for logging purposes

        if (!omitLogMessages) {
          this.logger.warn("State Update Failed", {
            ...result,
            attemptedState: state,
          });
        }
      }

      return result;
    } catch (error) {
      if (!omitLogMessages) {
        this.logger.error("Error when updating state", {
          attemptedState: state,
          error,
        });
      }
      throw error;
    }
  }
}

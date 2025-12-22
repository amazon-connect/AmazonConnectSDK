import { ConnectClientConfig } from "@amazon-connect/core";

import { ComponentState, CurrentState } from "../component-state";
import { StateChangeResult } from "../types";

export type HostStateManagerClientConstructor = {
  new (config: ConnectClientConfig): HostStateManagerClient;
};

export interface HostStateManagerClient {
  getState(instanceId: string): Promise<CurrentState>;

  updateState(
    instanceId: string,
    state: ComponentState,
  ): Promise<StateChangeResult>;
}

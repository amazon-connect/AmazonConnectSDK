import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { ComponentState, CurrentState } from "../component-state";
import { HostStateManagerClient } from "../host";
import { AppInstanceRoutes } from "../routes";
import { StateChangeResult } from "../types";
import { workspaceNamespace } from "../workspace-namespace";

export class AppStateClient
  extends ConnectClient
  implements HostStateManagerClient
{
  constructor(config: ConnectClientConfig) {
    super(workspaceNamespace, config);
  }

  getState(instanceId: string): Promise<CurrentState> {
    return this.context.proxy.request(AppInstanceRoutes.getState, {
      appInstanceId: instanceId,
    });
  }

  updateState(
    instanceId: string,
    state: ComponentState,
  ): Promise<StateChangeResult> {
    return this.context.proxy.request<StateChangeResult>(
      AppInstanceRoutes.updateState,
      {
        appInstanceId: instanceId,
        state,
      },
    );
  }
}

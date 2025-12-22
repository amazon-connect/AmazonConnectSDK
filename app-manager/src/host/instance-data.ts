import { ConfigBase } from "@amazon-connect/workspace-types";

import { ComponentState } from "../component-state";

export type InstanceData<TConfig extends ConfigBase = ConfigBase> = {
  instanceId: string;
  config: TConfig;
  connectionId: string;
  startTime: Date;
  state: ComponentState;
  stateVersion: number;
};

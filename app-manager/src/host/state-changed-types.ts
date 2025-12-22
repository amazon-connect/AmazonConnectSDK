import { ComponentState } from "../component-state";
import { InstanceData } from "./instance-data";

export type StateChanged<THost> = {
  host: THost;
  state: ComponentState;
  previous: { state: ComponentState };

  /**
   * @deprecated This property is deprecated. Use `host` instead.
   */
  appHost: THost;
};

type ExtractInstanceFromStateChanged<T> =
  T extends InstanceStateChanged<infer F> ? F : never;

export type InstanceStateChanged<TInstanceData extends InstanceData> =
  TInstanceData & {
    previous: { state: ComponentState };
    stateVersion: number;
  };

export type InstanceStateChangedHandler<
  TInstanceStateChanged extends InstanceStateChanged<TInstanceData>,
  TInstanceData extends
    InstanceData = ExtractInstanceFromStateChanged<TInstanceStateChanged>,
> = (evt: TInstanceStateChanged) => Promise<void>;

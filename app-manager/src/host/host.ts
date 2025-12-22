import { SubscriptionHandler } from "@amazon-connect/core";
import { AppConfig, ConfigBase } from "@amazon-connect/workspace-types";

import { SetIframeOptions } from "../app";
import { CurrentState } from "../component-state";
import { StateChanged } from "./state-changed-types";

type ExtractConfig<T> = T extends { config: Readonly<infer U> } ? U : never;

export interface GetState {
  getState(): Promise<CurrentState>;
}

export interface ReadonlyConfig<TConfig = AppConfig> {
  config: Readonly<TConfig>;
}

// TODO Change config to a general
export interface Host<
  THost extends Host<THost, TConfig>,
  TConfig extends ConfigBase = ExtractConfig<THost>,
> extends GetState,
    ReadonlyConfig<TConfig> {
  readonly instanceId: string;
  readonly connectionId: string;

  onStateChanged(handler: SubscriptionHandler<StateChanged<THost>>): void;
  offStateChanged(handler: SubscriptionHandler<StateChanged<THost>>): void;
  onProvisioned(handler: SubscriptionHandler<StateChanged<THost>>): void;
  offProvisioned(handler: SubscriptionHandler<StateChanged<THost>>): void;
  onRunning(handler: SubscriptionHandler<StateChanged<THost>>): void;
  offRunning(handler: SubscriptionHandler<StateChanged<THost>>): void;
  onError(handler: SubscriptionHandler<StateChanged<THost>>): void;
  offError(handler: SubscriptionHandler<StateChanged<THost>>): void;
}

export interface IFrameHost<
  THost extends Host<THost, TConfig>,
  TConfig extends ConfigBase = ExtractConfig<THost>,
> {
  setIFrame(iframe: HTMLIFrameElement, setIframeOptions?: SetIframeOptions): void;
}

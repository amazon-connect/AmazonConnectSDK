import {
  AmazonConnectProvider,
  SubscriptionHandler,
  SubscriptionHandlerRelay,
} from "@amazon-connect/core";

import { workspaceNamespace } from "../workspace-namespace";
import { Host } from "./host";
import { InstanceData } from "./instance-data";
import {
  InstanceStateChanged,
  InstanceStateChangedHandler,
  StateChanged,
} from "./state-changed-types";

export type StateChangeRelayParams<THost> = {
  provider: AmazonConnectProvider;
  topicKey: string;
  host: THost;
};

export type ExactEventForRelay<T, U extends T> = T & {
  [K in keyof U]: K extends keyof T ? U[K] : never;
};

export class StateChangeRelay<
  THandler extends SubscriptionHandler<TEvent>,
  THost extends Host<THost>,
  TInstanceData extends InstanceData,
  TEvent extends ExactEventForRelay<
    StateChanged<THost>,
    TEvent
  > = THandler extends SubscriptionHandler<infer E> ? E : never,
> extends SubscriptionHandlerRelay<
  InstanceStateChangedHandler<
    InstanceStateChanged<TInstanceData>,
    TInstanceData
  >,
  THandler,
  InstanceStateChanged<TInstanceData>,
  TEvent
> {
  protected readonly namespace = workspaceNamespace;
  protected readonly topicKey: string;
  private readonly host: THost;

  constructor({ provider, topicKey, host }: StateChangeRelayParams<THost>) {
    super(provider);

    this.topicKey = topicKey;
    this.host = host;
  }

  protected translate({
    state,
    previous,
  }: InstanceStateChanged<TInstanceData>): Promise<TEvent> {
    const evt = {
      appHost: this.host,
      host: this.host,
      state,
      previous,
    } as TEvent;

    return Promise.resolve(evt);
  }
}

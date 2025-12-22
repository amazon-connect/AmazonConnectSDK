import {
  AmazonConnectProvider,
  SubscriptionHandler,
  SubscriptionHandlerRelay,
} from "@amazon-connect/core";

import { AppStateTopicKey } from "../../topic-keys";
import { workspaceNamespace } from "../../workspace-namespace";
import {
  AppInstanceStateChanged,
  AppInstanceStateChangedHandler,
  AppStateChanged,
} from "../app-event-types";
import { AppHost } from "./app-host";

export type StateChangeRelayParams = {
  provider: AmazonConnectProvider;
  topicKey: AppStateTopicKey;
  appHost: AppHost;
};

type Exact<T, U extends T> = T & {
  [K in keyof U]: K extends keyof T ? U[K] : never;
};

export class StateChangeRelay<
  THandler extends SubscriptionHandler<TEvent>,
  TEvent extends Exact<
    AppStateChanged,
    TEvent
  > = THandler extends SubscriptionHandler<infer E> ? E : never,
> extends SubscriptionHandlerRelay<
  AppInstanceStateChangedHandler,
  THandler,
  AppInstanceStateChanged,
  TEvent
> {
  protected readonly namespace = workspaceNamespace;
  protected readonly topicKey: string;
  private readonly appHost: AppHost;

  constructor({ provider, topicKey, appHost }: StateChangeRelayParams) {
    super(provider);

    this.topicKey = topicKey;
    this.appHost = appHost;
  }

  protected translate({
    state,
    previous,
  }: AppInstanceStateChanged): Promise<TEvent> {
    const evt = {
      appHost: this.appHost,
      host: this.appHost,
      state,
      previous,
    } as TEvent;

    return Promise.resolve(evt);
  }
}

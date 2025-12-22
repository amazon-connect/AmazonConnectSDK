import {
  AmazonConnectProvider,
  SubscriptionHandler,
} from "@amazon-connect/core";

import {
  ExactEventForRelay,
  StateChanged,
  StateChangeRelay,
  StateChangeRelayParams,
} from "../../host";
import { AppStateTopicKey } from "../../topic-keys";
import {
  AppDestroyedHandler,
  AppDestroyingHandler,
  AppErrorHandler,
  AppProvisionedHandler,
  AppRestartingHandler,
  AppRunningHandler,
  AppStateChangedHandler,
  AppStoppedHandler,
} from "../app-event-types";
import { AppInstanceData } from "../app-instance-data";
import { AppFocusRelay } from "./app-focus-relay";
import { AppHost } from "./app-host";

export type AppStateChangeRelay<
  THandler extends SubscriptionHandler<TEvent>,
  TEvent extends ExactEventForRelay<
    StateChanged<AppHost>,
    TEvent
  > = THandler extends SubscriptionHandler<infer E> ? E : never,
> = StateChangeRelay<THandler, AppHost, AppInstanceData>;

export class AppHostEventRelay {
  readonly stateChanged: AppStateChangeRelay<AppStateChangedHandler>;
  readonly provisioned: AppStateChangeRelay<AppProvisionedHandler>;
  readonly running: AppStateChangeRelay<AppRunningHandler>;
  readonly stopped: AppStateChangeRelay<AppStoppedHandler>;
  readonly restarting: AppStateChangeRelay<AppRestartingHandler>;
  readonly destroying: AppStateChangeRelay<AppDestroyingHandler>;
  readonly destroyed: AppStateChangeRelay<AppDestroyedHandler>;
  readonly error: AppStateChangeRelay<AppErrorHandler>;
  readonly focused: AppFocusRelay;
  private destroyTimeout: NodeJS.Timeout | undefined;

  constructor(provider: AmazonConnectProvider, appHost: AppHost) {
    const paramsFactory: (
      topicKey: AppStateTopicKey,
    ) => StateChangeRelayParams<AppHost> = (topicKey) => ({
      provider,
      host: appHost,
      appHost,
      topicKey,
    });

    this.stateChanged = new StateChangeRelay(
      paramsFactory(AppStateTopicKey.StateChanged),
    );
    this.provisioned = new StateChangeRelay(
      paramsFactory(AppStateTopicKey.Provisioned),
    );
    this.running = new StateChangeRelay(
      paramsFactory(AppStateTopicKey.Running),
    );
    this.stopped = new StateChangeRelay(
      paramsFactory(AppStateTopicKey.Stopped),
    );
    this.restarting = new StateChangeRelay(
      paramsFactory(AppStateTopicKey.Restarting),
    );
    this.destroying = new StateChangeRelay(
      paramsFactory(AppStateTopicKey.Destroying),
    );
    this.destroyed = new StateChangeRelay(
      paramsFactory(AppStateTopicKey.Destroyed),
    );
    this.error = new StateChangeRelay(paramsFactory(AppStateTopicKey.Error));
    this.focused = new AppFocusRelay({ provider, host: appHost });
  }

  delayedDestroy(delay = 1000): void {
    // provides an opportunity for all relay events to complete
    this.destroyTimeout = setTimeout(() => this.immediateDestroy(), delay);
  }

  immediateDestroy(): void {
    clearTimeout(this.destroyTimeout);
    this.stateChanged.destroy();
    this.provisioned.destroy();
    this.running.destroy();
    this.stopped.destroy();
    this.restarting.destroy();
    this.destroying.destroy();
    this.destroyed.destroy();
    this.error.destroy();
    this.focused.destroy();
  }
}

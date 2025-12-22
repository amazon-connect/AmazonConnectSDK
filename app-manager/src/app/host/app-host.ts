import {
  AmazonConnectProvider,
  ConnectLogger,
  isNoResultResponseError,
} from "@amazon-connect/core";
import {
  AppConfig,
  AppManagerData,
  AppParameters,
  AppScope,
  LaunchSource,
} from "@amazon-connect/workspace-types";

import { AppManagerClient } from "../../app-manager-client";
import { ComponentState, CurrentState } from "../../component-state";
import { Host, HostStateManager } from "../../host";
import {
  AppStartedResult,
  AppStoppedResult,
  StateChangeResult,
} from "../../types";
import {
  AppDestroyedHandler,
  AppDestroyingHandler,
  AppErrorHandler,
  AppFocusedHandler,
  AppInstanceStateChanged,
  AppInstanceStateChangedHandler,
  AppProvisionedHandler,
  AppRestartingHandler,
  AppRunningHandler,
  AppStateChangedHandler,
  AppStoppedHandler,
} from "../app-event-types";
import { AppScopeKey } from "../app-scope-key";
import { AppStateClient } from "../app-state-client";
import { AppHostEventRelay } from "./app-host-event-relay";
import { AppHostParams } from "./app-host-params";

export abstract class AppHost<T extends AppConfig = AppConfig>
  implements Host<AppHost>
{
  readonly instanceId: string;
  /**
   * @deprecated This property is deprecated. Use `instanceId` instead.
   */
  readonly appInstanceId: string;
  /**
   * @deprecated This property is deprecated. Use `config` instead.
   */
  readonly appConfig: Readonly<T>;
  readonly config: Readonly<T>;
  readonly connectionId: string;
  readonly scope: Readonly<AppScope> | undefined;
  readonly scopeKey: AppScopeKey | undefined;
  readonly appCreateOrder: number;
  readonly parameters: Readonly<AppParameters> | undefined;
  readonly launchSource: string | undefined;
  readonly launchedBy: LaunchSource;
  readonly appManagerData: Readonly<AppManagerData> | undefined;
  readonly preventUserClose: boolean | undefined;
  readonly launchKey: string | undefined;

  protected readonly provider: AmazonConnectProvider;

  protected readonly appManagerClient: AppManagerClient;
  protected readonly logger: ConnectLogger;
  private readonly relays: AppHostEventRelay;
  private readonly destroyedHandler: AppInstanceStateChangedHandler;
  protected hostStateManager: HostStateManager;

  constructor({
    provider,
    appInstanceId,
    instanceId,
    connectionId,
    appConfig,
    config,
    scope,
    scopeKey,
    appCreateOrder,
    parameters,
    launchKey,
    launchSource,
    launchedBy,
    appManagerData,
    preventUserClose,
  }: AppHostParams) {
    this.instanceId = instanceId ?? appInstanceId;
    this.config = (config ?? appConfig) as T;

    // TODO Remove depreciated fields after cleanup
    this.appInstanceId = this.instanceId;
    this.appConfig = this.config;

    this.connectionId = connectionId;
    this.scope = scope;
    this.scopeKey = scopeKey;
    this.appCreateOrder = appCreateOrder;
    this.parameters = parameters;
    this.launchKey = launchKey;

    // These fields are done for backwards compatibility. It should not matter
    // which order items are rolled out between consumer here and Workspace
    // module. Once launchSource is removed, this can be cleaned up to a only
    // reference launchedBy
    this.launchedBy =
      launchedBy ??
      ({
        type: "unknown" as LaunchSource["type"],
        name: launchSource,
      } as LaunchSource);
    this.launchSource = launchedBy?.name ?? launchSource;

    this.appManagerData = appManagerData;
    this.preventUserClose = preventUserClose;
    this.provider = provider;
    this.destroyedHandler = this.handleDestroyed.bind(this);
    this.relays = new AppHostEventRelay(provider, this);
    this.appManagerClient = new AppManagerClient({ provider });
    this.hostStateManager = new HostStateManager({
      provider: provider,
      instanceId: this.instanceId,
      connectionId,
      config: this.config,
      hostStateManagerClient: AppStateClient,
    });

    this.logger = new ConnectLogger({
      source: "workspace.appHost",
      provider: provider,
      mixin: () => ({
        instanceId: this.instanceId,
        appName: this.config.name,
        arn: this.config.arn,
        connectionId: this.connectionId,
      }),
    });

    this.appManagerClient.onDestroyed(this.destroyedHandler, this.instanceId);
  }

  getState(): Promise<CurrentState> {
    return this.hostStateManager.getState();
  }

  protected updateState(
    state: ComponentState,
    omitLogMessages = false,
  ): Promise<StateChangeResult> {
    return this.hostStateManager.updateState(state, omitLogMessages);
  }

  async start(): Promise<AppStartedResult> {
    this.logger.info("App Start Called");

    try {
      const result = await this.updateState("running", true);

      if (result.success || result.state === "running") {
        this.logger.info("App Started", { ...result });
        return {
          success: true,
          state: result.state as "running",
        };
      } else {
        this.logger.error("App Start Failed", { ...result });
        return { success: false, reason: result.reason };
      }
    } catch (error) {
      if (isNoResultResponseError(error)) {
        this.logger.warn("Attempted to start an app that was not found");
        return { success: false, reason: "appNotFound" };
      }

      this.logger.error("Unexpected error when starting app", { error });

      throw error;
    }
  }

  async stop(): Promise<AppStoppedResult> {
    this.logger.info("App Stop Called");

    try {
      const result = await this.updateState("stopped", true);

      if (result.success || result.state === "stopped") {
        this.logger.info("App Stopped", { ...result });
        return {
          success: true,
          state: result.state as "stopped",
        };
      } else {
        // If the app attempted to be stopped is already destroying,
        // it should not be logged as an error.
        if (["destroying", "destroyed"].includes(result.state)) {
          this.logger.debug(
            "Attempted to stop a destroying app. Ignoring failure",
            { ...result },
          );
        } else {
          this.logger.error("App Stop Failed", { ...result });
        }
        return { success: false, reason: result.reason };
      }
    } catch (error) {
      if (isNoResultResponseError(error)) {
        this.logger.warn("Attempted to stop an app that was not found");
        return { success: false, reason: "appNotFound" };
      }

      this.logger.error("Unexpected error when stopping app", { error });

      throw error;
    }
  }

  async destroy(options?: {
    waitForCompletion?: boolean;
  }): Promise<{ destroyStarted: boolean; destroyCompleted: boolean }> {
    this.logger.info("App Destroy Called", {
      waitForCompletion: options?.waitForCompletion ?? false,
    });

    if (options?.waitForCompletion) {
      await this.appManagerClient.destroyInstance(this.instanceId);

      return {
        destroyStarted: true,
        destroyCompleted: true,
      };
    } else {
      const result = await this.updateState("destroying");

      return {
        destroyStarted: result.state === "destroying",
        destroyCompleted: false,
      };
    }
  }

  onStateChanged(handler: AppStateChangedHandler) {
    this.relays.stateChanged.on(handler, this.instanceId);
  }

  offStateChanged(handler: AppStateChangedHandler) {
    this.relays.stateChanged.off(handler, this.instanceId);
  }

  onProvisioned(handler: AppProvisionedHandler) {
    this.relays.provisioned.on(handler, this.instanceId);
  }

  offProvisioned(handler: AppProvisionedHandler) {
    this.relays.provisioned.off(handler, this.instanceId);
  }

  onRunning(handler: AppRunningHandler) {
    this.relays.running.on(handler, this.instanceId);
  }

  offRunning(handler: AppRunningHandler) {
    this.relays.running.off(handler, this.instanceId);
  }

  onStopped(handler: AppStoppedHandler) {
    this.relays.stopped.on(handler, this.instanceId);
  }

  offStopped(handler: AppStoppedHandler) {
    this.relays.stopped.off(handler, this.instanceId);
  }

  onRestarting(handler: AppRestartingHandler) {
    this.relays.restarting.on(handler, this.instanceId);
  }

  offRestarting(handler: AppRestartingHandler) {
    this.relays.restarting.off(handler, this.instanceId);
  }

  onDestroying(handler: AppDestroyingHandler) {
    this.relays.destroying.on(handler, this.instanceId);
  }

  offDestroying(handler: AppDestroyingHandler) {
    this.relays.destroying.off(handler, this.instanceId);
  }

  onDestroyed(handler: AppDestroyedHandler) {
    this.relays.destroyed.on(handler, this.instanceId);
  }

  offDestroyed(handler: AppDestroyedHandler) {
    this.relays.destroyed.off(handler, this.instanceId);
  }

  onError(handler: AppErrorHandler) {
    this.relays.error.on(handler, this.instanceId);
  }

  offError(handler: AppErrorHandler) {
    this.relays.error.off(handler, this.instanceId);
  }

  onFocus(handler: AppFocusedHandler) {
    this.relays.focused.on(handler, this.instanceId);
  }

  offFocus(handler: AppFocusedHandler) {
    this.relays.focused.off(handler, this.instanceId);
  }

  private handleDestroyed({
    state,
    stateVersion,
  }: AppInstanceStateChanged): Promise<void> {
    if (state !== "destroyed") {
      this.logger.error("Unexpected state for destroyed handler", {
        state,
        stateVersion,
      });
      return Promise.reject(new Error("Unexpected state"));
    }

    this.appManagerClient.offDestroyed(this.destroyedHandler, this.instanceId);
    this.relays.delayedDestroy();

    this.logger.info("App Host Destroyed", { state, stateVersion });

    return Promise.resolve();
  }
}

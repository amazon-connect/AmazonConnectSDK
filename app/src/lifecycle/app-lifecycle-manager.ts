import {
  AppConfig,
  AppParameters,
  AppScope,
  ContactScope,
  LaunchSource,
  LifecycleMessage,
} from "@amazon-connect/workspace-types";

import { AmazonConnectApp } from "../amazon-connect-app";
import { AppContext } from "../app-context";
import { AppStartHandler, AppStopHandler } from "./lifecycle-change";
import {
  LifecycleChangeParams,
  LifecycleManager,
  LifecycleState,
} from "./lifecycle-manager";
import { StartSubscriptionOptions } from "./start-subscription-options";

type LifecycleAppState = LifecycleState<AppConfig> & {
  contactScope?: ContactScope;
  scope?: AppScope;
  parameters?: AppParameters;
  launchedBy: LaunchSource;
};

type AppLifecycleChangeParams = LifecycleChangeParams<AppContext>;

export class AppLifecycleManager extends LifecycleManager<
  AmazonConnectApp,
  AppContext,
  LifecycleAppState
> {
  private readonly startHandlers: Set<AppStartHandler>;
  private readonly stopHandlers: Set<AppStopHandler>;

  constructor(provider: AmazonConnectApp) {
    super(provider);
    this.startHandlers = new Set();
    this.stopHandlers = new Set();
  }

  handleLifecycleChangeMessage(msg: LifecycleMessage): Promise<void> {
    const context = new AppContext({
      provider: this.provider,
      instanceId: msg.instanceId,
      config: msg.config as AppConfig,
      parameters: msg.parameters,
      contactScope: msg.contactScope,
      scope: msg.scope,
      launchedBy: msg.launchedBy,
    });

    this.state.instanceId = msg.instanceId;
    this.state.appInstanceId = msg.instanceId;
    this.state.config = msg.config as AppConfig;
    this.state.appConfig = msg.config as AppConfig;
    this.state.contactScope = msg.contactScope;

    const params: AppLifecycleChangeParams = { context };

    switch (msg.stage) {
      case "create":
        return this.handleCreate(params);
      case "start":
        return this.handleStart(params);
      case "stop":
        return this.handleStop(params);
      case "destroy":
        return this.handleDestroy(params);
    }
  }

  onStart(
    handler: AppStartHandler,
    options: StartSubscriptionOptions | undefined,
  ) {
    this.startHandlers.add(handler);

    // Allows subscribers to get start information even if they add their
    // subscription after the start event fires while app is running
    if (options?.invokeIfRunning) {
      if (this.state.isRunning) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleLifecycleChange(
          { ...this.getAppLifecycleChangeParams(), stage: "start" },
          (e) => handler(e),
          false,
        );
      }
    }
  }

  onStop(handler: AppStopHandler) {
    this.stopHandlers.add(handler);
  }

  offStart(handler: AppStartHandler) {
    this.startHandlers.delete(handler);
  }

  offStop(handler: AppStopHandler) {
    this.stopHandlers.delete(handler);
  }

  private async handleStart(params: AppLifecycleChangeParams): Promise<void> {
    if (this.isDestroyed) {
      this.logger.error("An attempt was Start after a Destroy. No Action", {
        appInstanceId: params.context.instanceId,
      });
      return;
    }

    if (!this.isCreated) {
      this.logger.error(
        "An attempt was invoke Start before Create. No Action",
        { appInstanceId: params.context.instanceId },
      );
      return;
    }

    this.state.isRunning = true;
    this.logger.info("Begin Lifecycle Start");
    const handlerRunResult = await Promise.all(
      [...this.startHandlers].map((h) =>
        this.handleLifecycleChange(
          { ...params, stage: "start" },
          (e) => h(e),
          false,
        ),
      ),
    );

    this.logger.debug("Completed all start handlers", {
      count: this.startHandlers.size,
      errorCount: handlerRunResult.filter(({ success }) => !success).length,
    });
  }

  private async handleStop(params: AppLifecycleChangeParams): Promise<void> {
    if (this.isDestroyed) {
      this.logger.error("An attempt was Stop after a Destroy. No Action", {
        appInstanceId: params.context.instanceId,
      });
      return;
    }

    if (!this.isCreated) {
      this.logger.error("An attempt was invoke Stop before Create. No Action", {
        appInstanceId: params.context.instanceId,
      });
      return;
    }

    this.state.isRunning = false;
    this.logger.info("Begin Lifecycle Stop");
    const handlerRunResult = await Promise.all(
      [...this.stopHandlers].map((h) =>
        this.handleLifecycleChange(
          { ...params, stage: "stop" },
          (e) => h(e),
          false,
        ),
      ),
    );

    this.logger.debug("Completed all stop handlers", {
      count: this.stopHandlers.size,
      errorCount: handlerRunResult.filter(({ success }) => !success).length,
    });
  }

  private async handleDestroy(params: AppLifecycleChangeParams): Promise<void> {
    if (this.isDestroyed) {
      this.logger.error(
        "An attempt was invoke Destroy multiple times. No Action",
        {
          appInstanceId: params.context.instanceId,
        },
      );
      return;
    }

    if (!this.isCreated) {
      this.logger.error(
        "An attempt was invoke Destroy before Create. No Action",
        {
          appInstanceId: params.context.instanceId,
        },
      );
      return;
    }

    this.isDestroyed = true;
    this.state.isRunning = false;
    this.logger.info("Begin Lifecycle Destroy");
    const { config } = this.provider;

    const { success } = await this.handleLifecycleChange(
      { ...params, stage: "destroy" },
      (e) => (config.onDestroy ? config.onDestroy(e) : Promise.resolve()),
      true,
    );

    if (success) {
      this.sendLifecycleHandlerCompletedMessage(
        params.context.instanceId,
        "destroy",
      );
    }
  }

  private getAppLifecycleChangeParams(): AppLifecycleChangeParams {
    return {
      context: new AppContext({
        provider: this.provider,
        instanceId: this.state.instanceId!,
        config: this.state.config as AppConfig,
        contactScope: this.state.contactScope,
        scope: this.state.scope,
        parameters: this.state.parameters,
        launchedBy: this.state.launchedBy,
      }),
    };
  }
}

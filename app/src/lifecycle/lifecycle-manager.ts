import {
  AppConfig,
  LifecycleMessage,
} from "@amzn/amazon-connect-sdk-app-common";
import { ConnectLogger } from "@amzn/amazon-connect-sdk-core";

import { AppContext } from "../app-context";
import { AmazonConnectAppProvider } from "../app-provider";
import { AppProxy } from "../proxy";
import {
  AppStartHandler,
  AppStopHandler,
  LifecycleStageChangeEvent,
  LifecycleStageChangeHandler,
} from "./lifecycle-change";
import { StartSubscriptionOptions } from "./start-subscription-options";

type LifecycleChangeParams = {
  context: AppContext;
};

type LifecycleAppState =
  | {
      isRunning: true;
      appInstanceId: string;
      appConfig: AppConfig;
    }
  | {
      isRunning: false;
      appInstanceId?: string;
      appConfig?: AppConfig;
    };

export class LifecycleManager {
  private readonly provider: AmazonConnectAppProvider;
  private readonly startHandlers: Set<AppStartHandler>;
  private readonly stopHandlers: Set<AppStopHandler>;
  private readonly state: LifecycleAppState;
  private readonly logger: ConnectLogger;
  private isCreated: boolean;
  private isDestroyed: boolean;

  constructor(provider: AmazonConnectAppProvider) {
    this.provider = provider;
    this.startHandlers = new Set();
    this.stopHandlers = new Set();
    this.state = { isRunning: false };
    this.isCreated = false;
    this.isDestroyed = false;

    this.logger = new ConnectLogger({
      source: "app.lifecycleManager",
      provider,
      mixin: () => ({
        state: this.state,
        isCreated: this.isCreated,
        isDestroyed: this.isDestroyed,
      }),
    });
  }

  handleLifecycleChangeMessage(msg: LifecycleMessage): Promise<void> {
    const context = new AppContext(
      this.provider,
      msg.appInstanceId,
      msg.appConfig
    );
    this.state.appInstanceId = msg.appInstanceId;
    this.state.appConfig = msg.appConfig;

    const params: LifecycleChangeParams = { context };

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
    options: StartSubscriptionOptions | undefined
  ) {
    this.startHandlers.add(handler);

    // Allows subscribers to get start information even if they add their
    // subscription after the start event fires while app is running
    if (options?.invokeIfRunning) {
      if (this.state.isRunning) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleLifecycleChange(
          { ...this.getLifecycleChangeParams(), stage: "start" },
          (e) => handler(e),
          false
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

  get appState(): LifecycleAppState {
    return { ...this.state };
  }

  private async handleCreate(params: LifecycleChangeParams): Promise<void> {
    if (this.isDestroyed) {
      this.logger.error("An attempt was Create after a Destroy. No Action", {
        appInstanceId: params.context.appInstanceId,
      });
      return;
    }

    if (this.isCreated) {
      this.logger.error(
        "An attempt was invoke Create after it was already invoked. No Action",
        { appInstanceId: params.context.appInstanceId }
      );
      return;
    }

    this.logger.debug("Begin Lifecycle Create", {
      appInstanceId: params.context.appInstanceId,
    });
    if (!this.provider.config?.onCreate) {
      const msg =
        "App did not specify an onCreated handler. This is required. Closing app";
      const data = { appInstanceId: params.context.appInstanceId };
      this.logger.error(msg, { appInstanceId: params.context.appInstanceId });
      this.provider.sendFatalError(msg, data);
      return;
    }

    const { success } = await this.handleLifecycleChange(
      { ...params, stage: "create" },
      (e) => this.provider.config.onCreate(e),
      true
    );

    if (success) {
      this.isCreated = true;
      this.sendLifecycleHandlerCompletedMessage(
        params.context.appInstanceId,
        "create"
      );
    }
  }

  private async handleStart(params: LifecycleChangeParams): Promise<void> {
    if (this.isDestroyed) {
      this.logger.error("An attempt was Start after a Destroy. No Action", {
        appInstanceId: params.context.appInstanceId,
      });
      return;
    }

    if (!this.isCreated) {
      this.logger.error(
        "An attempt was invoke Start before Create. No Action",
        { appInstanceId: params.context.appInstanceId }
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
          false
        )
      )
    );

    this.logger.debug("Completed all start handlers", {
      count: this.startHandlers.size,
      errorCount: handlerRunResult.filter(({ success }) => !success).length,
    });
  }

  private async handleStop(params: LifecycleChangeParams): Promise<void> {
    if (this.isDestroyed) {
      this.logger.error("An attempt was Stop after a Destroy. No Action", {
        appInstanceId: params.context.appInstanceId,
      });
      return;
    }

    if (!this.isCreated) {
      this.logger.error("An attempt was invoke Stop before Create. No Action", {
        appInstanceId: params.context.appInstanceId,
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
          false
        )
      )
    );

    this.logger.debug("Completed all stop handlers", {
      count: this.stopHandlers.size,
      errorCount: handlerRunResult.filter(({ success }) => !success).length,
    });
  }

  private async handleDestroy(params: LifecycleChangeParams): Promise<void> {
    if (this.isDestroyed) {
      this.logger.error(
        "An attempt was invoke Destroy multiple times. No Action",
        {
          appInstanceId: params.context.appInstanceId,
        }
      );
      return;
    }

    if (!this.isCreated) {
      this.logger.error(
        "An attempt was invoke Destroy before Create. No Action",
        {
          appInstanceId: params.context.appInstanceId,
        }
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
      true
    );

    if (success) {
      this.sendLifecycleHandlerCompletedMessage(
        params.context.appInstanceId,
        "destroy"
      );
    }
  }

  private async handleLifecycleChange<TEvent extends LifecycleStageChangeEvent>(
    evt: TEvent,
    action: LifecycleStageChangeHandler<TEvent>,
    isFatal: boolean
  ): Promise<{ success: boolean }> {
    let success = false;
    try {
      await action(evt);
      success = true;
    } catch (error) {
      const { appInstanceId } = evt.context;

      if (isFatal) {
        const msg = `An fatal error occurred when handling a ${evt.stage} lifecycle action. Closing app`;

        this.logger.error(msg, { appInstanceId, error });

        this.provider.sendFatalError(msg, error as Error);
      } else {
        this.logger.error(
          `An error occurred when handling a ${evt.stage} lifecycle action.`,
          {
            appInstanceId,
            error,
          }
        );
      }
    }
    return { success };
  }

  private getLifecycleChangeParams(): LifecycleChangeParams {
    return {
      context: new AppContext(
        this.provider,
        this.state.appInstanceId!,
        this.state.appConfig!
      ),
    };
  }

  private sendLifecycleHandlerCompletedMessage(
    appInstanceId: string,
    stage: "create" | "destroy"
  ): void {
    this.logger.debug(`Sending lifecycle ${stage} completed signal`);
    const proxy = this.provider.getProxy() as AppProxy;
    proxy.sendLifecycleHandlerCompleted(appInstanceId, stage);
  }
}

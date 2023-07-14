import {
  AppConfig,
  ConnectLogger,
  LifecycleMessage,
} from "@amzn/amazon-connect-sdk-core";
import {
  AppStartHandler,
  AppStopHandler,
  LifecycleStageChangeEvent,
  LifecycleStageChangeHandler,
} from "./lifecycle-change";
import { AppContext } from "../app-context";
import { StartSubscriptionOptions } from "./start-subscription-options";
import { AmazonConnectAppProvider } from "../app-provider";
import { AppProxy } from "../proxy";

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

  constructor(provider: AmazonConnectAppProvider) {
    this.provider = provider;
    this.startHandlers = new Set();
    this.stopHandlers = new Set();
    this.state = { isRunning: false };

    this.logger = new ConnectLogger({
      source: "app.lifecycleManager",
      provider,
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

      default:
        throw new Error(`Unknown lifecycle state "${msg.stage}"`);
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
    this.logger.info("Begin Lifecycle Create", {
      appConfig: params.context.appConfig,
    });
    await this.handleLifecycleChange(
      { ...params, stage: "create" },
      (e) => this.provider.config.onCreate(e),
      true
    );

    this.sendLifecycleHandlerCompletedMessage(
      params.context.appInstanceId,
      "create"
    );
  }

  private async handleStart(params: LifecycleChangeParams): Promise<void> {
    this.state.isRunning = true;
    this.logger.info("Begin Lifecycle Start");
    await Promise.all(
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
    });
  }

  private async handleStop(params: LifecycleChangeParams): Promise<void> {
    this.state.isRunning = false;
    this.logger.info("Begin Lifecycle Stop");
    await Promise.all(
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
    });
  }

  private async handleDestroy(params: LifecycleChangeParams): Promise<void> {
    this.logger.info("Begin Lifecycle Destroy");
    const { config } = this.provider;

    await this.handleLifecycleChange(
      { ...params, stage: "destroy" },
      (e) => (config.onDestroy ? config.onDestroy(e) : Promise.resolve()),
      true
    );

    this.sendLifecycleHandlerCompletedMessage(
      params.context.appInstanceId,
      "destroy"
    );
  }

  private async handleLifecycleChange<TEvent extends LifecycleStageChangeEvent>(
    evt: TEvent,
    action: LifecycleStageChangeHandler<TEvent>,
    isFatal: boolean
  ): Promise<void> {
    try {
      await action(evt);
    } catch (err) {
      const { appInstanceId } = evt.context;

      if (isFatal) {
        this.logger.error(
          `An fatal error occurred when handling a ${evt.stage} lifecycle action. Closing app`,
          { appInstanceId, err }
        );

        // TODO Implement calling error
      } else {
        this.logger.error(
          `An error occurred when handling a ${evt.stage} lifecycle action.`,
          {
            appInstanceId,
            err,
          }
        );
      }
    }
  }

  private getLifecycleChangeParams(): LifecycleChangeParams {
    if (
      !this.state.isRunning ||
      (this.state.appInstanceId && this.state.appConfig)
    )
      throw new Error("Can only get params when app is running");

    return {
      context: new AppContext(
        this.provider,
        this.state.appInstanceId,
        this.state.appConfig
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

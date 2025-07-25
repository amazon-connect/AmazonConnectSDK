import { ConnectLogger } from "@amazon-connect/core";
import {
  AppConfig,
  ConfigBase,
  LifecycleMessage,
} from "@amazon-connect/workspace-types";

import { AppContext } from "../app-context";
import { BaseProvider } from "../base-provider";
import { Context } from "../context";
import { AppProxy } from "../proxy";
import {
  LifecycleStageChangeEvent,
  ServiceCreatedEvent,
} from "./lifecycle-change";

export type LifecycleChangeParams<TContext extends Context> = {
  context: TContext;
};

export type LifecycleState<TConfig extends ConfigBase = ConfigBase> =
  | {
      isRunning: true;
      instanceId: string;
      config: TConfig;
      /**
       * @deprecated This property is deprecated. Use `instanceId` instead.
       */
      appInstanceId: string;
      /**
       * @deprecated This property is deprecated. Use `config` instead.
       */
      appConfig: AppConfig;
    }
  | {
      isRunning: false;
      instanceId?: string;
      config?: TConfig;
      /**
       * @deprecated This property is deprecated. Use `instanceId` instead.
       */
      appInstanceId?: string;
      /**
       * @deprecated This property is deprecated. Use `config` instead.
       */
      appConfig?: AppConfig;
    };

type StageChangeEvent<TContext extends Context> = TContext extends AppContext
  ? LifecycleStageChangeEvent
  : ServiceCreatedEvent;

export abstract class LifecycleManager<
  TProvider extends BaseProvider,
  TContext extends Context,
  TLifestyleState extends LifecycleState = LifecycleState,
> {
  protected readonly provider: TProvider;
  protected readonly state: TLifestyleState;
  protected readonly logger: ConnectLogger;
  protected isCreated: boolean;
  protected isDestroyed: boolean;

  constructor(provider: TProvider) {
    this.provider = provider;
    this.state = { isRunning: false } as TLifestyleState;
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

  abstract handleLifecycleChangeMessage(msg: LifecycleMessage): Promise<void>;

  get appState(): TLifestyleState {
    return { ...this.state };
  }

  protected async handleCreate(
    params: LifecycleChangeParams<TContext>,
  ): Promise<void> {
    if (this.isDestroyed) {
      this.logger.error("An attempt was Create after a Destroy. No Action", {
        instanceId: params.context.instanceId,
      });
      return;
    }

    if (this.isCreated) {
      this.logger.error(
        "An attempt was invoke Create after it was already invoked. No Action",
        { instanceId: params.context.instanceId },
      );
      return;
    }

    this.logger.debug("Begin Lifecycle Create", {
      instanceId: params.context.instanceId,
    });

    if (!this.provider.config?.onCreate) {
      const msg =
        "App did not specify an onCreated handler. This is required. Closing app";
      const data = {
        appInstanceId: params.context.instanceId,
        instanceId: params.context.instanceId,
      };
      this.logger.error(msg, { instanceId: params.context.instanceId });
      this.provider.sendFatalError(msg, data);
      return;
    }

    const { success } = await this.handleLifecycleChange(
      { ...params, stage: "create" } as StageChangeEvent<TContext>,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      (e) => this.provider.config.onCreate(e as any),
      true,
    );

    if (success) {
      this.isCreated = true;
      this.sendLifecycleHandlerCompletedMessage(
        params.context.instanceId,
        "create",
      );
    }
  }

  protected async handleLifecycleChange<
    TEvent extends StageChangeEvent<TContext>,
  >(
    evt: TEvent,
    action: (evt: TEvent) => Promise<void>,
    isFatal: boolean,
  ): Promise<{ success: boolean }> {
    let success = false;

    try {
      await action(evt);
      success = true;
    } catch (error) {
      const { instanceId: instanceId } = evt.context;

      if (isFatal) {
        const msg = `An fatal error occurred when handling a ${evt.stage} lifecycle action. Closing app`;

        this.logger.error(msg, { instanceId, error });

        this.provider.sendFatalError(msg, error as Error);
      } else {
        this.logger.error(
          `An error occurred when handling a ${evt.stage} lifecycle action.`,
          {
            instanceId,
            error,
          },
        );
      }
    }
    return { success };
  }

  protected sendLifecycleHandlerCompletedMessage(
    appInstanceId: string,
    stage: "create" | "destroy",
  ): void {
    this.logger.debug(`Sending lifecycle ${stage} completed signal`);
    const proxy = this.provider.getProxy() as AppProxy;
    proxy.sendLifecycleHandlerCompleted(appInstanceId, stage);
  }
}

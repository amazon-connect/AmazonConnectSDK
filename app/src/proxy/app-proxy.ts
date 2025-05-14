import {
  AcknowledgeMessage,
  ConnectLogger,
  Proxy,
  sdkVersion,
  SubscriptionHandlerData,
  SubscriptionTopic,
  TimeoutTracker,
  TimeoutTrackerCancelledEvent,
} from "@amazon-connect/core";
import {
  AppDownstreamMessage,
  AppHostInitMessage,
  AppMessageOrigin,
  AppPublishMessage,
  AppUpstreamMessage,
  CloseAppMessage,
  LifecycleHandlerCompletedMessage,
  ServiceErrorMessage,
} from "@amazon-connect/workspace-types";

import { BaseProvider } from "../base-provider";
import { AmazonConnectAppConfig, AmazonConnectServiceConfig } from "../config";
import { AppLifecycleManager } from "../lifecycle/app-lifecycle-manager";
import { ServiceLifecycleManager } from "../lifecycle/service-lifecycle-manager";
import { getConnectionTimeout } from "./connection-timeout";

export class AppProxy extends Proxy<
  AmazonConnectAppConfig | AmazonConnectServiceConfig,
  AppUpstreamMessage,
  AppDownstreamMessage
> {
  private readonly channel: MessageChannel;
  private readonly lifecycleManager:
    | AppLifecycleManager
    | ServiceLifecycleManager;
  private readonly appLogger: ConnectLogger;
  private connectionTimer: TimeoutTracker | undefined;

  constructor(
    provider: BaseProvider,
    lifecycleManager: AppLifecycleManager | ServiceLifecycleManager,
  ) {
    super(provider);

    this.channel = new MessageChannel();
    this.lifecycleManager = lifecycleManager;

    this.appLogger = new ConnectLogger({
      source: "app.appProxy",
      provider: provider,
    });
  }

  get proxyType(): string {
    return "AppProxy";
  }

  sendLifecycleHandlerCompleted(
    appInstanceId: string,
    stage: "create" | "destroy",
  ) {
    const msg: LifecycleHandlerCompletedMessage = {
      type: "appLifecycleHandlerCompleted",
      stage,
      appInstanceId,
    };
    this.sendOrQueueMessageToSubject(msg);
  }

  tryCloseApp(
    message: string | undefined,
    isFatalError?: boolean,
    data?: Record<string, unknown> | Error,
  ) {
    const msg: CloseAppMessage = {
      type: "closeApp",
      isFatalError: isFatalError ?? false,
      message,
      data,
    };

    this.sendOrQueueMessageToSubject(msg);
  }

  sendServiceError(
    message: string | undefined,
    data?: Record<string, unknown> | Error,
  ) {
    const msg: ServiceErrorMessage = {
      type: "serviceError",
      message,
      data,
    };

    this.sendOrQueueMessageToSubject(msg);
  }

  publish(topic: SubscriptionTopic, data: SubscriptionHandlerData): void {
    const msg: AppPublishMessage = {
      type: "appPublish",
      topic,
      data,
    };

    this.sendOrQueueMessageToSubject(msg);
  }

  protected initProxy(): void {
    const hostInitMessage: AppHostInitMessage = {
      type: "connect-app-host-init",
      sdkVersion,
      providerId: this.provider.id,
    };

    this.status.update({ status: "initializing" });
    this.channel.port1.onmessage = (evt) => this.consumerMessageHandler(evt);

    this.connectionTimer = TimeoutTracker.start(
      this.connectionTimeout.bind(this),
      getConnectionTimeout(this.provider.config),
    );

    window.parent.postMessage(hostInitMessage, "*", [this.channel.port2]);
    this.appLogger.debug("Send connect message to configure proxy");
  }

  protected sendMessageToSubject(message: AppUpstreamMessage): void {
    this.channel.port1.postMessage(message);
  }

  protected getUpstreamMessageOrigin(): AppMessageOrigin {
    if (document?.location) {
      const { origin, pathname: path } = document.location;
      return {
        _type: "app",
        providerId: this.provider.id,
        origin,
        path,
      };
    } else {
      return {
        _type: "app",
        providerId: this.provider.id,
        origin: "unknown",
        path: "unknown",
      };
    }
  }

  protected handleConnectionAcknowledge(msg: AcknowledgeMessage): void {
    // ConnectionTimer will always be defined here
    if (!this.connectionTimer!.complete()) {
      this.appLogger.error(
        "Workspace connection acknowledge received after timeout. App is not connected to workspace.",
        {
          timeout: this.connectionTimer!.timeoutMs,
        },
      );
      return;
    }

    super.handleConnectionAcknowledge(msg);
  }

  protected handleMessageFromSubject(msg: AppDownstreamMessage): void {
    switch (msg.type) {
      case "appLifecycle":
        this.lifecycleManager
          .handleLifecycleChangeMessage(msg)
          .catch((error: unknown) => {
            this.appLogger.error(
              "An error occurred when invoking handleLifecycleChangeMessage",
              { error },
            );
          });
        break;

      default:
        super.handleMessageFromSubject(msg);
    }
  }

  private connectionTimeout(evt: TimeoutTrackerCancelledEvent) {
    this.status.update({
      status: "error",
      reason: "Workspace connection timeout",
      details: { ...evt },
    });

    this.publishError({
      message: "App failed to connect to workspace in the allotted time",
      key: "workspaceConnectTimeout",
      details: { ...evt },
      isFatal: true,
      proxyStatus: { initialized: false },
    });
  }

  protected addContextToLogger(): Record<string, unknown> {
    const { isRunning: appIsRunning } = this.lifecycleManager.appState;

    if (document?.location) {
      const { origin, pathname: path } = document.location;
      return { appIsRunning, app: { origin, path } };
    } else {
      return {
        appIsRunning,
        app: { origin: "unknown", path: "unknown" },
      };
    }
  }
}

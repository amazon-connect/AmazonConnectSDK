import {
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
  AppMessageOrigin,
  AppPublishMessage,
  AppUpstreamMessage,
  CloseAppMessage,
  LifecycleHandlerCompletedMessage,
} from "@amazon-connect/workspace-types";

import { AmazonConnectApp } from "../amazon-connect-app";
import { AmazonConnectAppConfig } from "../amazon-connect-app-config";
import { LifecycleManager } from "../lifecycle";
import { getConnectionTimeout } from "./connection-timeout";

export class AppProxy extends Proxy<
  AmazonConnectAppConfig,
  AppUpstreamMessage,
  AppDownstreamMessage
> {
  private readonly channel: MessageChannel;
  private readonly lifecycleManager: LifecycleManager;
  private readonly appLogger: ConnectLogger;
  private connectionTimer: TimeoutTracker | undefined;

  constructor(provider: AmazonConnectApp, lifecycleManager: LifecycleManager) {
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

  publish(topic: SubscriptionTopic, data: SubscriptionHandlerData): void {
    const msg: AppPublishMessage = {
      type: "appPublish",
      topic,
      data,
    };

    this.sendOrQueueMessageToSubject(msg);
  }

  protected initProxy(): void {
    const testMessage = {
      type: "connect-app-host-init",
      sdkVersion,
    };

    this.status.update({ status: "initializing" });
    this.channel.port1.onmessage = (evt) => this.consumerMessageHandler(evt);

    this.connectionTimer = TimeoutTracker.start(
      this.connectionTimeout.bind(this),
      getConnectionTimeout(this.provider.config),
    );

    window.parent.postMessage(testMessage, "*", [this.channel.port2]);
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
        origin,
        path,
      };
    } else {
      return {
        _type: "app",
        origin: "unknown",
        path: "unknown",
      };
    }
  }

  protected handleConnectionAcknowledge(): void {
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

    super.handleConnectionAcknowledge();
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

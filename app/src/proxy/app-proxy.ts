import {
  AppDownstreamMessage,
  AppPublishMessage,
  ConnectLogger,
  LifecycleHandlerCompletedMessage,
  Proxy,
  SubscriptionHandlerData,
  SubscriptionTopic,
} from "@amzn/amazon-connect-sdk-core";
import { AmazonConnectAppConfig } from "../amazon-connect-app-config";
import { LifecycleManager } from "../lifecycle";
import { AmazonConnectAppProvider } from "../app-provider";

export class AppProxy extends Proxy<
  AmazonConnectAppConfig,
  AppDownstreamMessage
> {
  private readonly channel: MessageChannel;
  private readonly lifecycleManager: LifecycleManager;
  private readonly appLogger: ConnectLogger;

  constructor(
    provider: AmazonConnectAppProvider,
    lifecycleManager: LifecycleManager
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
    stage: "create" | "destroy"
  ) {
    const msg: LifecycleHandlerCompletedMessage = {
      type: "appLifecycleHandlerCompleted",
      stage,
      appInstanceId,
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
      body: { msg: "hello" },
    };

    this.updateConnectionStatus({ status: "initializing" });
    this.channel.port1.onmessage = (evt) => this.consumerMessageHandler(evt);

    window.parent.postMessage(testMessage, "*", [this.channel.port2]);
    this.appLogger.debug("Send connect message to configure proxy");
  }
  protected sendMessageToSubject(message: any): void {
    this.channel.port1.postMessage(message);
  }

  protected handleMessageFromSubject(
    msg: AppDownstreamMessage,
    originalMessageEvent: MessageEvent<any>
  ): void {
    switch (msg.type) {
      case "appLifecycle":
        this.lifecycleManager.handleLifecycleChangeMessage(msg);
        break;

      default:
        super.handleMessageFromSubject(msg, originalMessageEvent);
    }
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

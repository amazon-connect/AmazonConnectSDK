import { AmazonConnectConfig } from "../amazon-connect-config";
import {
  DownstreamMessage,
  SubscribeMessage,
  PublishMessage,
  UnsubscribeMessage,
  LogMessage,
} from "../messaging";
import {
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionMap,
  SubscriptionTopic,
} from "../messaging/subscription";
import {
  ProxyConnectionChangedHandler,
  ProxyConnectionEvent,
  ProxyConnectionStatus,
} from "./proxy-connection";
import { AmazonConnectProvider } from "../provider";
import { ConnectLogger, LogLevel } from "../logging";

export abstract class Proxy<
  TConfig extends AmazonConnectConfig = AmazonConnectConfig,
  TDownstreamMessage extends
    | { type: string }
    | DownstreamMessage = DownstreamMessage
> {
  protected readonly provider: AmazonConnectProvider<TConfig>;
  private readonly subscriptions: SubscriptionMap<SubscriptionHandler>;
  private readonly connectionStatusChangeHandlers: Set<ProxyConnectionChangedHandler>;
  private readonly logger: ConnectLogger;
  private upstreamMessageQueue: any[];
  private connectionEstablished: boolean;
  private isInitialized: boolean;
  private status: ProxyConnectionStatus;

  constructor(provider: AmazonConnectProvider<TConfig>) {
    this.provider = provider;
    this.logger = new ConnectLogger({
      source: "core.proxy",
      mixin: () => ({ proxyType: this.proxyType }),
    });

    this.upstreamMessageQueue = [];
    this.connectionEstablished = false;
    this.isInitialized = false;
    this.subscriptions = new SubscriptionMap();
    this.connectionStatusChangeHandlers = new Set();
    this.status = "notConnected";
  }

  init(): void {
    if (this.isInitialized) throw new Error("Proxy already initialized");
    this.isInitialized = true;
    this.initProxy();
  }
  protected abstract initProxy(): void;

  subscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    const sendMessageToSubject = this.subscriptions.get(topic).length < 1;
    this.subscriptions.add(topic, handler as SubscriptionHandler);

    if (sendMessageToSubject) {
      const msg: SubscribeMessage = {
        type: "subscribe",
        topic,
      };

      this.sendOrQueueMessageToSubject(msg);
    }
  }

  unsubscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    this.subscriptions.remove(topic, handler as SubscriptionHandler);

    if (this.subscriptions.get(topic).length < 1) {
      const msg: UnsubscribeMessage = {
        type: "unsubscribe",
        topic,
      };

      this.sendOrQueueMessageToSubject(msg);
    }
  }

  log({
    level,
    source,
    message,
    loggerId,
    data,
  }: {
    level: LogLevel;
    source: string;
    message: string;
    loggerId: string;
    data?: Record<string, unknown>;
  }): void {
    // Sanitize guards against a caller provided data object containing a
    // non-cloneable object which will fail if sent through a message channel
    const sanitizedData = data ? JSON.parse(JSON.stringify(data)) : undefined;

    const logMsg: LogMessage = {
      type: "log",
      level,
      time: new Date(),
      source,
      message,
      loggerId,
      data: sanitizedData,
      context: this.addContextToLogger(),
    };

    this.sendOrQueueMessageToSubject(logMsg);
  }

  sendLogMessage(message: LogMessage): void {
    if (message.type !== "log") {
      this.logger.error("Attempted to send invalid log message", {
        message,
      });
      return;
    }

    message.context = { ...message.context, ...this.addContextToLogger() };

    this.sendOrQueueMessageToSubject(message);
  }

  protected sendOrQueueMessageToSubject(message: any): void {
    if (this.connectionEstablished) {
      this.sendMessageToSubject(message);
    } else {
      this.upstreamMessageQueue.push(message);
    }
  }

  protected abstract sendMessageToSubject(message: any): void;

  protected abstract addContextToLogger(): Record<string, unknown>;

  protected consumerMessageHandler(evt: MessageEvent<any>): void {
    if (!this.isInitialized) {
      this.logger.error(
        "Attempted to process message from subject prior to proxy being initializing. Message not processed",
        { originalMessageEventData: evt.data }
      );
      return;
    }

    const { data } = evt;

    if (!("type" in data)) {
      // TODO Clean this up... probably safe to ignore without logging
      this.logger.warn("Unknown inbound message", {
        originalMessageEventData: data,
      });
      return;
    }

    // Naming of type confusing because outbound to worker is inbound to client
    const msg = data as TDownstreamMessage;

    this.handleMessageFromSubject(msg);
  }

  protected handleMessageFromSubject(msg: TDownstreamMessage) {
    this.handleDefaultMessageFromSubject(msg as DownstreamMessage);
  }

  private handleDefaultMessageFromSubject(msg: DownstreamMessage) {
    switch (msg.type) {
      case "acknowledge":
        this.handleConnectionAcknowledge();
        break;
      case "publish":
        this.handlePublish(msg);
        break;
      default:
        this.logger.error("Unknown inbound message", {
          originalMessageEventData: msg,
        });
        return;
    }
  }

  private handleConnectionAcknowledge(): void {
    this.updateConnectionStatus({
      status: "ready",
    });

    this.connectionEstablished = true;

    // Sends any messages in queue
    while (this.upstreamMessageQueue.length) {
      const msg = this.upstreamMessageQueue.shift();
      this.sendMessageToSubject(msg);
    }
  }

  private handlePublish(msg: PublishMessage) {
    this.subscriptions
      .get(msg.topic)
      .map((handler) =>
        this.handleAsyncSubscriptionHandlerInvoke(handler, msg)
      );
  }

  private async handleAsyncSubscriptionHandlerInvoke(
    handler: SubscriptionHandler,
    { topic, data }: PublishMessage
  ): Promise<void> {
    try {
      await handler(data);
    } catch (error) {
      this.logger.error("An error occurred when handling subscription", {
        topic,
        error,
      });
    }
  }

  public abstract get proxyType(): string;
  public get connectionStatus(): ProxyConnectionStatus {
    return this.status;
  }

  onConnectionStatusChange(handler: ProxyConnectionChangedHandler): void {
    this.connectionStatusChangeHandlers.add(handler);
  }
  offConnectionStatusChange(handler: ProxyConnectionChangedHandler): void {
    this.connectionStatusChangeHandlers.delete(handler);
  }

  protected updateConnectionStatus(evt: ProxyConnectionEvent): void {
    this.status = evt.status;
    this.logger.debug("Proxy Connection Status Changed", {
      status: evt.status,
    });
    [...this.connectionStatusChangeHandlers].forEach((h) => {
      try {
        h(evt);
      } catch (error) {
        this.logger.error(
          "An error occurred within a ProxyConnectionChangedHandler",
          { error }
        );
      }
    });
  }
}

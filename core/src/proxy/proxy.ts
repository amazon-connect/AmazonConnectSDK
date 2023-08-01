import { AmazonConnectConfig } from "../amazon-connect-config";
import {
  DownstreamMessage,
  SubscribeMessage,
  PublishMessage,
  UnsubscribeMessage,
  LogMessage,
  ErrorMessage,
} from "../messaging";
import {
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionSet,
  SubscriptionTopic,
} from "../messaging/subscription";
import {
  ProxyConnectionChangedHandler,
  ProxyConnectionStatus,
} from "./proxy-connection/types";
import { AmazonConnectProvider } from "../provider";
import { ConnectLogger, LogLevel } from "../logging";
import { ProxyConnectionStatusManager } from "./proxy-connection";
import {
  UpstreamError,
  UpstreamErrorHandler,
  UpstreamErrorService,
} from "./error";

export abstract class Proxy<
  TConfig extends AmazonConnectConfig = AmazonConnectConfig,
  TDownstreamMessage extends
    | { type: string }
    | DownstreamMessage = DownstreamMessage
> {
  protected readonly provider: AmazonConnectProvider<TConfig>;
  protected readonly status: ProxyConnectionStatusManager;
  private readonly subscriptions: SubscriptionSet<SubscriptionHandler>;
  private readonly errorService: UpstreamErrorService;
  private readonly logger: ConnectLogger;
  private upstreamMessageQueue: any[];
  private connectionEstablished: boolean;
  private isInitialized: boolean;

  constructor(provider: AmazonConnectProvider<TConfig>) {
    this.provider = provider;
    this.logger = new ConnectLogger({
      source: "core.proxy",
      mixin: () => ({ proxyType: this.proxyType }),
    });

    this.status = new ProxyConnectionStatusManager();
    this.errorService = new UpstreamErrorService();
    this.upstreamMessageQueue = [];
    this.connectionEstablished = false;
    this.isInitialized = false;
    this.subscriptions = new SubscriptionSet();
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
    this.subscriptions.add(topic, handler as SubscriptionHandler);

    const msg: SubscribeMessage = {
      type: "subscribe",
      topic,
    };

    this.sendOrQueueMessageToSubject(msg);
  }

  unsubscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    this.subscriptions.delete(topic, handler as SubscriptionHandler);

    if (this.subscriptions.isEmpty(topic)) {
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
      case "error":
        this.handleError(msg);
        break;
      default:
        this.logger.error("Unknown inbound message", {
          originalMessageEventData: msg,
        });
        return;
    }
  }

  private handleConnectionAcknowledge(): void {
    this.status.update({
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

  private handleError(msg: ErrorMessage) {
    if (msg.isFatal) {
      const { message: reason, type: _, ...details } = msg;
      this.status.update({ status: "error", reason, details });
    }

    const err: UpstreamError = {
      message: msg.message,
      key: msg.key,
      details: msg.details,
      isFatal: msg.isFatal,
      connectionStatus: this.connectionStatus,
      proxyStatus: msg.status,
    };

    this.errorService.invoke(err);
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
    return this.status.getStatus();
  }

  onError(handler: UpstreamErrorHandler): void {
    this.errorService.onError(handler);
  }
  offError(handler: UpstreamErrorHandler): void {
    this.errorService.offError(handler);
  }

  onConnectionStatusChange(handler: ProxyConnectionChangedHandler): void {
    this.status.onChange(handler);
  }
  offConnectionStatusChange(handler: ProxyConnectionChangedHandler): void {
    this.status.offChange(handler);
  }
}

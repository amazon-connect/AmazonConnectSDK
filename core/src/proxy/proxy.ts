import { AmazonConnectConfig } from "../amazon-connect-config";
import {
  AmazonConnectError,
  AmazonConnectErrorHandler,
} from "../amazon-connect-error";
import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import {
  ConnectLogger,
  createLogMessage,
  LogProxy,
  ProxyLogData,
} from "../logging";
import {
  DownstreamMessage,
  ErrorMessage,
  LogMessage,
  PublishMessage,
  ResponseMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  UpstreamMessage,
  UpstreamMessageOrigin,
} from "../messaging";
import {
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionHandlerIdMapping,
  SubscriptionManager,
  SubscriptionTopic,
} from "../messaging/subscription";
import { AmazonConnectProvider } from "../provider";
import {
  ConnectRequestData,
  ConnectResponseData,
  createRequestMessage,
  RequestManager,
} from "../request";
import { ErrorService } from "./error";
import {
  ProxyConnectionChangedHandler,
  ProxyConnectionStatus,
  ProxyConnectionStatusManager,
} from "./proxy-connection";

export abstract class Proxy<
  TConfig extends AmazonConnectConfig = AmazonConnectConfig,
  TUpstreamMessage extends { type: string } | UpstreamMessage = UpstreamMessage,
  TDownstreamMessage extends
    | { type: string }
    | DownstreamMessage = DownstreamMessage,
> implements LogProxy
{
  protected readonly provider: AmazonConnectProvider<TConfig>;
  protected readonly status: ProxyConnectionStatusManager;
  private readonly subscriptions: SubscriptionManager;
  private readonly errorService: ErrorService;
  private readonly logger: ConnectLogger;
  private requestManager: RequestManager;
  private upstreamMessageQueue: TUpstreamMessage[];
  private connectionEstablished: boolean;
  private isInitialized: boolean;

  constructor(provider: AmazonConnectProvider<TConfig>) {
    this.provider = provider;
    this.logger = new ConnectLogger({
      source: "core.proxy",
      mixin: () => ({ proxyType: this.proxyType }),
    });

    this.requestManager = new RequestManager();
    this.status = new ProxyConnectionStatusManager();
    this.errorService = new ErrorService();
    this.upstreamMessageQueue = [];
    this.connectionEstablished = false;
    this.isInitialized = false;
    this.subscriptions = new SubscriptionManager();
  }

  init(): void {
    if (this.isInitialized) throw new Error("Proxy already initialized");
    this.isInitialized = true;
    this.initProxy();
  }
  protected abstract initProxy(): void;

  request<TResponse extends ConnectResponseData>(
    namespace: AmazonConnectNamespace,
    command: string,
    data?: ConnectRequestData,
    origin?: UpstreamMessageOrigin,
  ): Promise<TResponse> {
    const msg = createRequestMessage(
      namespace,
      command,
      data,
      origin ?? this.getUpstreamMessageOrigin(),
    );

    const resp = this.requestManager.processRequest<TResponse>(msg);

    this.sendOrQueueMessageToSubject(msg as TUpstreamMessage);

    return resp;
  }

  subscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>,
    origin?: UpstreamMessageOrigin,
  ): void {
    const { handlerId } = this.subscriptions.add(
      topic,
      handler as SubscriptionHandler,
    );

    const msg: SubscribeMessage = {
      type: "subscribe",
      topic,
      messageOrigin: origin ?? this.getUpstreamMessageOrigin(),
      handlerId,
    };

    this.sendOrQueueMessageToSubject(msg as TUpstreamMessage);
  }

  unsubscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>,
    origin?: UpstreamMessageOrigin,
  ): void {
    this.subscriptions.delete(topic, handler as SubscriptionHandler);

    if (this.subscriptions.isEmpty(topic)) {
      const msg: UnsubscribeMessage = {
        type: "unsubscribe",
        topic,
        messageOrigin: origin ?? this.getUpstreamMessageOrigin(),
      };

      this.sendOrQueueMessageToSubject(msg as TUpstreamMessage);
    }
  }

  log(logData: ProxyLogData): void {
    const logMsg = createLogMessage(
      logData,
      this.addContextToLogger(),
      this.getUpstreamMessageOrigin(),
    );

    this.sendOrQueueMessageToSubject(logMsg as TUpstreamMessage);
  }

  sendLogMessage(message: LogMessage): void {
    if (message.type !== "log") {
      this.logger.error("Attempted to send invalid log message", {
        message,
      });
      return;
    }

    message.context = { ...message.context, ...this.addContextToLogger() };

    this.sendOrQueueMessageToSubject(message as TUpstreamMessage);
  }

  protected sendOrQueueMessageToSubject(message: TUpstreamMessage): void {
    if (this.connectionEstablished) {
      this.sendMessageToSubject(message);
    } else {
      this.upstreamMessageQueue.push(message);
    }
  }

  protected abstract sendMessageToSubject(message: TUpstreamMessage): void;

  protected abstract addContextToLogger(): Record<string, unknown>;

  protected abstract getUpstreamMessageOrigin(): UpstreamMessageOrigin;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected consumerMessageHandler(evt: MessageEvent<any>): void {
    if (!this.isInitialized) {
      this.logger.error(
        "Attempted to process message from subject prior to proxy being initializing. Message not processed",
        { originalMessageEventData: evt.data },
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      case "response":
        this.handleResponse(msg);
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

  protected handleConnectionAcknowledge(): void {
    this.status.update({
      status: "ready",
    });

    this.connectionEstablished = true;

    // Sends any messages in queue
    while (this.upstreamMessageQueue.length) {
      const msg = this.upstreamMessageQueue.shift();
      this.sendMessageToSubject(msg as TUpstreamMessage);
    }
  }

  private handleResponse(msg: ResponseMessage) {
    this.requestManager.processResponse(msg);
  }

  private handlePublish(msg: PublishMessage) {
    const { handlerId, topic } = msg;

    if (handlerId) {
      const handler = this.subscriptions.getById(topic, handlerId);
      if (handler) {
        void this.handleAsyncSubscriptionHandlerInvoke(
          { handler, handlerId },
          msg,
        );
      }
    } else {
      this.subscriptions
        .get(topic)
        .map((handlerIdMapping) =>
          this.handleAsyncSubscriptionHandlerInvoke(handlerIdMapping, msg),
        );
    }
  }

  private handleError(msg: ErrorMessage) {
    if (msg.isFatal) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { message: reason, type: _, ...details } = msg;
      this.status.update({ status: "error", reason: reason, details });
    }

    this.publishError({
      message: msg.message,
      key: msg.key,
      details: msg.details,
      isFatal: msg.isFatal,
      proxyStatus: msg.status,
    });
  }

  protected publishError(
    error: Omit<AmazonConnectError, "connectionStatus">,
  ): void {
    const fullError: AmazonConnectError = {
      ...error,
      connectionStatus: this.connectionStatus,
    };

    this.errorService.invoke(fullError);
  }

  private async handleAsyncSubscriptionHandlerInvoke(
    { handler, handlerId }: SubscriptionHandlerIdMapping,
    { topic, data }: PublishMessage,
  ): Promise<void> {
    try {
      await handler(data);
    } catch (error) {
      this.logger.error("An error occurred when handling subscription", {
        topic,
        error,
        handlerId,
      });
    }
  }

  public abstract get proxyType(): string;
  public get connectionStatus(): ProxyConnectionStatus {
    return this.status.getStatus();
  }

  onError(handler: AmazonConnectErrorHandler): void {
    this.errorService.onError(handler);
  }
  offError(handler: AmazonConnectErrorHandler): void {
    this.errorService.offError(handler);
  }

  onConnectionStatusChange(handler: ProxyConnectionChangedHandler): void {
    this.status.onChange(handler);
  }
  offConnectionStatusChange(handler: ProxyConnectionChangedHandler): void {
    this.status.offChange(handler);
  }
}

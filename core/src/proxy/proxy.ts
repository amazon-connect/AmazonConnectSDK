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
  AcknowledgeMessage,
  ChildConnectionEnabledDownstreamMessage,
  ChildConnectionEnabledUpstreamMessage,
  ChildUpstreamMessage,
  ErrorMessage,
  HealthCheckMessage,
  LogMessage,
  MetricMessage,
  PublishMessage,
  ResponseMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  UpstreamMessageOrigin,
} from "../messaging";
import {
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionHandlerIdMapping,
  SubscriptionManager,
  SubscriptionTopic,
} from "../messaging/subscription";
import { createMetricMessage, MetricProxy, ProxyMetricData } from "../metric";
import { AmazonConnectProvider } from "../provider";
import {
  ConnectRequestData,
  ConnectResponseData,
  createRequestMessage,
  RequestManager,
} from "../request";
import { ChannelManager, UpdateChannelPortParams } from "./channel-manager";
import { ErrorService } from "./error";
import {
  HealthCheckManager,
  HealthCheckStatusChangedHandler,
} from "./health-check";
import {
  ProxyConnectionChangedHandler,
  ProxyConnectionStatus,
  ProxyConnectionStatusManager,
} from "./proxy-connection";
import type {
  AddChildChannelDirectParams,
  AddChildChannelPortParams,
} from "./proxy-types";

export abstract class Proxy<
    TConfig extends AmazonConnectConfig = AmazonConnectConfig,
    TUpstreamMessage extends
      | { type: string }
      | ChildConnectionEnabledUpstreamMessage = ChildConnectionEnabledUpstreamMessage,
    TDownstreamMessage extends
      | { type: string }
      | ChildConnectionEnabledDownstreamMessage = ChildConnectionEnabledDownstreamMessage,
  >
  implements LogProxy, MetricProxy
{
  protected readonly provider: AmazonConnectProvider<TConfig>;
  protected readonly status: ProxyConnectionStatusManager;
  private readonly subscriptions: SubscriptionManager;
  private readonly errorService: ErrorService;
  protected readonly logger: ConnectLogger;
  private readonly channelManager: ChannelManager;
  private readonly healthCheck: HealthCheckManager;

  private requestManager: RequestManager;
  private upstreamMessageQueue: TUpstreamMessage[];
  private connectionEstablished: boolean;
  private isInitialized: boolean;
  private connectionId: string | null;

  constructor(provider: AmazonConnectProvider<TConfig>) {
    this.provider = provider;
    this.logger = new ConnectLogger({
      source: "core.proxy",
      provider,
      mixin: () => ({
        proxyType: this.proxyType,
        connectionId: this.connectionId,
      }),
    });

    this.requestManager = new RequestManager(provider);
    this.status = new ProxyConnectionStatusManager(provider);
    this.errorService = new ErrorService(provider);
    this.upstreamMessageQueue = [];
    this.connectionEstablished = false;
    this.isInitialized = false;
    this.subscriptions = new SubscriptionManager();
    this.connectionId = null;

    this.channelManager = new ChannelManager(
      provider,
      this.sendOrQueueMessageToSubject.bind(this) as (
        message: ChildUpstreamMessage,
      ) => void,
    );
    this.healthCheck = new HealthCheckManager({
      provider,
      sendHealthCheck: this.sendOrQueueMessageToSubject.bind(this) as (
        message: HealthCheckMessage,
      ) => void,
      getUpstreamMessageOrigin: this.getUpstreamMessageOrigin.bind(this),
    });
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

  sendMetric({ metricData, time, namespace }: ProxyMetricData): void {
    const metricMessage = createMetricMessage(
      {
        metricData,
        time,
        namespace,
      },
      this.getUpstreamMessageOrigin(),
    );

    this.sendOrQueueMessageToSubject(metricMessage as TUpstreamMessage);
  }

  sendMetricMessage(metricMessage: MetricMessage): void {
    if (metricMessage.type !== "metric") {
      this.logger.error("Attempted to send invalid metric message", {
        metricMessage,
      });
      return;
    }
    this.sendOrQueueMessageToSubject(metricMessage as TUpstreamMessage);
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
  protected consumerMessageHandler(evt: { data: any }): void {
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
    this.handleDefaultMessageFromSubject(
      msg as ChildConnectionEnabledDownstreamMessage,
    );
  }

  private handleDefaultMessageFromSubject(
    msg: ChildConnectionEnabledDownstreamMessage,
  ) {
    switch (msg.type) {
      case "acknowledge":
        this.handleConnectionAcknowledge(msg);
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
      case "childDownstreamMessage":
        this.channelManager.handleDownstreamMessage(msg);
        break;
      case "childConnectionClose":
        this.channelManager.handleCloseMessage(msg);
        break;
      case "healthCheckResponse":
        this.healthCheck.handleResponse(msg);
        break;
      default:
        this.logger.error("Unknown inbound message", {
          originalMessageEventData: msg,
        });
        return;
    }
  }

  protected handleConnectionAcknowledge(msg: AcknowledgeMessage): void {
    this.connectionId = msg.connectionId;

    this.status.update({
      status: "ready",
      connectionId: msg.connectionId,
    });

    this.connectionEstablished = true;

    // Sends any messages in queue
    while (this.upstreamMessageQueue.length) {
      const msg = this.upstreamMessageQueue.shift();
      this.sendMessageToSubject(msg as TUpstreamMessage);
    }

    this.healthCheck.start(msg);
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
        .map(
          (handlerIdMapping) =>
            void this.handleAsyncSubscriptionHandlerInvoke(
              handlerIdMapping,
              msg,
            ),
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

  onHealthCheckStatusChanged(handler: HealthCheckStatusChangedHandler): void {
    this.healthCheck.onStatusChanged(handler);
  }
  offHealthCheckStatusChanged(handler: HealthCheckStatusChangedHandler): void {
    this.healthCheck.offStatusChanged(handler);
  }

  /**
   * @deprecated Use addChildIframeChannel instead. This method will be removed in a future version.
   */
  addChildChannel(params: AddChildChannelPortParams): void {
    // Legacy method that only supports MessagePort channels
    this.addChildIframeChannel(params);
  }

  /**
   * Adds a component-based child channel to the proxy.
   *
   * This method establishes a communication channel using component function calls instead
   * of MessagePorts. This is useful when both the proxy and child entity exist in the same
   * execution context, such as within the same browser window or iframe.
   *
   * Component channels provide better performance than iframe channels since they avoid
   * the overhead of serialization and can support synchronous communication patterns.
   *
   * @param params - Component channel configuration
   * @param params.connectionId - UUID identifier for this channel connection
   * @param params.providerId - UUID of the provider that owns this channel
   * @param params.sendDownstreamMessage - Function to send messages to the child entity
   * @param params.setUpstreamMessageHandler - Function to register upstream message handler
   *
   * @example
   * ```typescript
   * proxy.addChildComponentChannel({
   *   connectionId: "child-uuid",
   *   providerId: "provider-uuid",
   *   sendDownstreamMessage: (message) => childComponent.receive(message),
   *   setUpstreamMessageHandler: (handler) => childComponent.onUpstream = handler
   * });
   * ```
   */
  addChildIframeChannel(params: AddChildChannelPortParams): void {
    this.channelManager.addChannel({
      ...params,
      type: "iframe",
    });
  }

  /**
   * Adds a component-based child channel for communication with child entities.
   *
   * This method establishes a communication channel using direct function calls instead
   * of MessagePorts. This is useful when both the proxy and child entity exist in the same
   * execution context and can directly reference each other's functions.
   *
   * @param params - Configuration parameters for the component function channel
   * @param params.connectionId - Unique UUID identifier for this channel connection
   * @param params.providerId - UUID of the provider that owns this channel connection
   * @param params.sendDownstreamMessage - Function to send messages from proxy to child entity
   * @param params.setUpstreamMessageHandler - Function to register handler for messages from child entity
   *
   * @example
   * ```typescript
   * // Child entity exposes these functions
   * const childAPI = {
   *   receive: (message) => { },
   *   onUpstream: null as ((message) => void) | null
   * };
   *
   * proxy.addChildComponentChannel({
   *   connectionId: "550e8400-e29b-41d4-a716-446655440001", // UUID
   *   providerId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // UUID
   *   sendDownstreamMessage: (message) => {
   *     childAPI.receive(message);
   *   },
   *   setUpstreamMessageHandler: (handler) => {
   *     childAPI.onUpstream = handler;
   *   }
   * });
   * ```
   */
  addChildComponentChannel(params: AddChildChannelDirectParams): void {
    this.channelManager.addChannel({
      ...params,
      type: "component",
    });
  }

  /**
   * Updates an existing iframe channel with a new MessagePort.
   *
   * This method is only applicable to iframe channels. Component channels cannot
   * be updated and will result in an error. The old MessagePort is properly cleaned up
   * (event listeners removed, port closed) before the new port is configured.
   *
   * @param params - Update parameters
   * @param params.connectionId - UUID identifier for the channel to update
   * @param params.port - New MessagePort instance to replace the existing one
   * @param params.providerId - UUID of the provider that owns this channel
   *
   * @example
   * ```typescript
   * const { port1, port2 } = new MessageChannel();
   * proxy.updateChildIframeChannelPort({
   *   connectionId: "550e8400-e29b-41d4-a716-446655440000",
   *   port: port1,
   *   providerId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
   * });
   * ```
   */
  updateChildIframeChannelPort(params: UpdateChannelPortParams): void {
    this.channelManager.updateChannelPort(params);
  }

  /**
   * @deprecated Use updateChildIframeChannelPort instead. This method will be removed in a future version.
   */
  updateChildChannelPort(params: UpdateChannelPortParams): void {
    this.updateChildIframeChannelPort(params);
  }

  getConnectionId(): Promise<string> {
    if (this.connectionId) return Promise.resolve(this.connectionId);

    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout | undefined = undefined;

      const handler: ProxyConnectionChangedHandler = (evt) => {
        if (evt.status === "ready") {
          this.offConnectionStatusChange(handler);
          clearInterval(timeout);
          resolve(evt.connectionId);
        }
      };

      timeout = setTimeout(() => {
        this.logger.error("Timeout getting connection id");
        this.offConnectionStatusChange(handler);
        reject(new Error("Timeout getting connectionId"));
      }, 10 * 1000);

      this.onConnectionStatusChange(handler);
    });
  }

  protected resetConnection(reason: string): void {
    this.connectionEstablished = false;

    this.status.update({
      status: "reset",
      reason,
    });

    const { subscriptionHandlerCount } = this.restoreAllHandler();

    this.logger.info("Resetting proxy", {
      reason,
      subscriptionHandlerCount,
    });
  }

  protected restoreAllHandler(): { subscriptionHandlerCount: number } {
    const subscriptionHandlerIds =
      this.subscriptions.getAllSubscriptionHandlerIds();

    // Restore all subscriptions
    subscriptionHandlerIds
      ?.map<SubscribeMessage>(({ topic, handlerId }) => ({
        type: "subscribe",
        topic,
        messageOrigin: this.getUpstreamMessageOrigin(),
        handlerId,
      }))
      .forEach((msg) =>
        this.sendOrQueueMessageToSubject(msg as TUpstreamMessage),
      );

    return { subscriptionHandlerCount: subscriptionHandlerIds?.length ?? -1 };
  }

  protected unsubscribeAllHandlers(): void {
    const subscriptionHandlerIds =
      this.subscriptions.getAllSubscriptionHandlerIds();

    this.logger.info("Unsubscribing all handlers from proxy", {
      subscriptionHandlerCount: subscriptionHandlerIds?.length ?? -1,
    });

    subscriptionHandlerIds
      ?.map<UnsubscribeMessage>(({ topic }) => ({
        type: "unsubscribe",
        topic,
        messageOrigin: this.getUpstreamMessageOrigin(),
      }))
      .forEach((msg) =>
        this.sendOrQueueMessageToSubject(msg as TUpstreamMessage),
      );
  }
}

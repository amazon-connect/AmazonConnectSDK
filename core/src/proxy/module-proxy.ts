import {
  ModuleSubscriptionTopic,
  SubscriptionHandler,
  SubscriptionHandlerData,
} from "../messaging/subscription";
import { ConnectRequestData, ConnectResponseData } from "../request";
import { ProxyConnectionChangedHandler } from "./proxy-connection";
import { ProxyInfo } from "./proxy-info";

export interface ModuleProxy {
  request<T extends ConnectResponseData>(
    command: string,
    data?: ConnectRequestData,
  ): Promise<T>;
  subscribe<T extends SubscriptionHandlerData>(
    topic: ModuleSubscriptionTopic,
    handler: SubscriptionHandler<T>,
  ): void;
  unsubscribe<T extends SubscriptionHandlerData>(
    topic: ModuleSubscriptionTopic,
    handler: SubscriptionHandler<T>,
  ): void;
  getProxyInfo(): ProxyInfo;
  onConnectionStatusChange(handler: ProxyConnectionChangedHandler): void;
  offConnectionStatusChange(handler: ProxyConnectionChangedHandler): void;
}

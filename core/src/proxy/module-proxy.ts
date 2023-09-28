import {
  ModuleSubscriptionTopic,
  SubscriptionHandler,
  SubscriptionHandlerData,
} from "../messaging/subscription";
import { ProxyConnectionChangedHandler } from "./proxy-connection";
import { ProxyInfo } from "./proxy-info";

export interface ModuleProxy {
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

import {
  getGlobalProvider,
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionTopic,
} from "@amzn/amazon-connect-sdk-core";

import { AmazonConnectAppProvider } from "../app-provider";
import { AppProxy } from "../proxy";

export type MessagingClientConfig = {
  provider?: AmazonConnectAppProvider;
};

export class MessagingClient {
  private readonly provider: AmazonConnectAppProvider | undefined;

  constructor(config?: MessagingClientConfig) {
    this.provider = config?.provider;
  }

  subscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    this.getProxy().subscribe(topic, handler);
  }

  unsubscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    this.getProxy().unsubscribe(topic, handler);
  }

  publish<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    data: THandlerData
  ): void {
    this.getProxy().publish(topic, data);
  }

  private getProxy(): AppProxy {
    return this.getProvider().getProxy() as AppProxy;
  }

  private getProvider(): AmazonConnectAppProvider {
    if (this.provider) return this.provider;
    else return getGlobalProvider<AmazonConnectAppProvider>();
  }
}

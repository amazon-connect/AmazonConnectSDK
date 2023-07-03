import {
  Context,
  SubscriptionHandler,
  SubscriptionHandlerData,
} from "@amzn/connect-core";
import { AmazonConnectAppProvider } from "../app-provider";
import { AppProxy } from "../proxy";
import { SubscriptionTopic } from "@amzn/connect-core/lib/messaging/subscription/types";

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
    // TODO check to verify app can subscribe to topic on given namespace

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
    // TODO check to verify app can publish to topic on given namespace

    this.getProxy().publish(topic, data);
  }

  private getProxy(): AppProxy {
    return this.getProvider().getProxy() as AppProxy;
  }

  private getProvider(): AmazonConnectAppProvider {
    // TODO Implement this to not need Context
    if (this.provider) return this.provider;
    else return new Context().getProvider() as AmazonConnectAppProvider;
  }
}

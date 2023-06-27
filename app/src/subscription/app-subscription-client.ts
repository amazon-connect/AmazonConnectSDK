import {
  AppSubscriptionTopic,
  Context,
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionTopicWithModule,
} from "@amzn/connect-core";
import { AmazonConnectAppProvider } from "../app-provider";
import { AppProxy } from "../proxy";

export type AppSubscriptionClientConfig = {
  provider?: AmazonConnectAppProvider;
};

export class AppSubscriptionClient {
  private readonly provider: AmazonConnectAppProvider | undefined;

  constructor(config?: AppSubscriptionClientConfig) {
    this.provider = config?.provider;
  }

  subscribe<THandlerData extends SubscriptionHandlerData>(
    topic: AppSubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    // TODO check to verify app can subscribe to topic on given namespace

    this.getProxy().subscribe(
      AppSubscriptionClient.getModuleTopic(topic),
      handler
    );
  }

  unsubscribe<THandlerData extends SubscriptionHandlerData>(
    topic: AppSubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    this.getProxy().unsubscribe(
      AppSubscriptionClient.getModuleTopic(topic),
      handler
    );
  }

  publish<THandlerData extends SubscriptionHandlerData>(
    topic: AppSubscriptionTopic,
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

  private static getModuleTopic(
    topic: AppSubscriptionTopic
  ): SubscriptionTopicWithModule {
    const { namespace: parameter, key } = topic;

    return { module: "app-subscription", key, parameter };
  }
}

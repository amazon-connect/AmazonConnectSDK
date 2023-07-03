import { Context } from "@amzn/amazon-connect-sdk-core";
import { AmazonConnectAppProvider } from "./app-provider";
import {
  AppStartHandler,
  AppStopHandler,
  StartSubscriptionOptions,
} from "./lifecycle";

export type ConnectAppClientConfig = {
  provider?: AmazonConnectAppProvider;
};

export class ConnectAppClient {
  private readonly provider: AmazonConnectAppProvider | undefined;

  constructor(config?: ConnectAppClientConfig) {
    this.provider = config?.provider;
  }

  onStart(handler: AppStartHandler, options?: StartSubscriptionOptions): void {
    this.getProvider().onStart(handler, options);
  }

  onStop(handler: AppStopHandler): void {
    this.getProvider().onStop(handler);
  }

  offStart(handler: AppStartHandler): void {
    this.getProvider().offStart(handler);
  }

  offStop(handler: AppStopHandler): void {
    this.getProvider().offStop(handler);
  }

  private getProvider(): AmazonConnectAppProvider {
    // TODO Implement this to not need Context
    if (this.provider) return this.provider;
    else return new Context().getProvider() as AmazonConnectAppProvider;
  }
}

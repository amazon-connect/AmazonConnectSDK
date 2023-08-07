import { AppConfig } from "@amzn/amazon-connect-sdk-app-common";
import { Context } from "@amzn/amazon-connect-sdk-core";
import { AmazonConnectAppProvider } from "./app-provider";

export class AppContext extends Context<AmazonConnectAppProvider> {
  public readonly appInstanceId: string;
  public readonly appConfig: Readonly<AppConfig>;

  constructor(
    provider: AmazonConnectAppProvider,
    appInstanceId: string,
    appConfig: AppConfig
  ) {
    super(provider);
    this.appInstanceId = appInstanceId;
    this.appConfig = appConfig;
  }
}

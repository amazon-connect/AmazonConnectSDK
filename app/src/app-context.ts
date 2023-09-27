import { AppConfig } from "@amazon-connect/app-types";
import { Context } from "@amazon-connect/core";

import { AmazonConnectApp } from "./amazon-connect-app";

export class AppContext extends Context<AmazonConnectApp> {
  public readonly appInstanceId: string;
  public readonly appConfig: Readonly<AppConfig>;

  constructor(
    provider: AmazonConnectApp,
    appInstanceId: string,
    appConfig: AppConfig,
  ) {
    super(provider);
    this.appInstanceId = appInstanceId;
    this.appConfig = appConfig;
  }
}

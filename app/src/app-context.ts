import { Context } from "@amazon-connect/core";
import { AppConfig, AppScope } from "@amazon-connect/workspace-types";

import { AmazonConnectApp } from "./amazon-connect-app";

export class AppContext extends Context<AmazonConnectApp> {
  public readonly appInstanceId: string;
  public readonly scope: Readonly<AppScope>;
  public readonly appConfig: Readonly<AppConfig>;

  constructor(
    provider: AmazonConnectApp,
    appInstanceId: string,
    appConfig: AppConfig,
    appScope: AppScope,
  ) {
    super(provider);
    this.appInstanceId = appInstanceId;
    this.appConfig = appConfig;
    this.scope = appScope;
  }
}

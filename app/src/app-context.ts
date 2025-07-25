import { Context } from "@amazon-connect/core";
import {
  AppConfig,
  AppParameters,
  AppScope,
  ContactScope,
  LaunchSource,
} from "@amazon-connect/workspace-types";

import { AmazonConnectApp } from "./amazon-connect-app";

export class AppContext extends Context<AmazonConnectApp> {
  /**
   * @deprecated This property is deprecated. Use `instanceId` instead.
   */
  public readonly appInstanceId: string;
  public readonly instanceId: string;

  /**
   * @deprecated This property is deprecated. Use `config` instead.
   */
  public readonly appConfig: Readonly<AppConfig>;
  public readonly config: Readonly<AppConfig>;

  public readonly scope?: Readonly<AppScope>;
  /**
   * @deprecated This property is deprecated. Use `scope` instead.
   */
  public readonly contactScope?: Readonly<ContactScope>;

  public readonly parameters?: Readonly<AppParameters>;

  public readonly launchedBy: LaunchSource;

  constructor({
    provider,
    instanceId,
    config,
    parameters,
    contactScope,
    scope,
    launchedBy,
  }: {
    provider: AmazonConnectApp;
    instanceId: string;
    config: AppConfig;
    parameters: AppParameters | undefined;
    contactScope: ContactScope | undefined;
    scope: AppScope | undefined;
    launchedBy?: LaunchSource;
  }) {
    super(provider);
    this.appInstanceId = instanceId;
    this.instanceId = instanceId;
    this.config = config;
    this.appConfig = config;
    this.contactScope = contactScope;
    this.scope = scope;
    this.parameters = parameters;
    this.launchedBy =
      launchedBy ??
      ({
        // Not a valid type, but launchedBy will always been provided
        // in practice for apps
        type: "unknown" as LaunchSource["type"],
      } as LaunchSource);
  }
}

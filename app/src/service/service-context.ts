import { Context } from "@amazon-connect/core";
import { ServiceConfig } from "@amazon-connect/workspace-types";

import { AmazonConnectService } from "./amazon-connect-service";

export class ServiceContext extends Context<AmazonConnectService> {
  public readonly instanceId: string;
  public readonly config: Readonly<ServiceConfig>;

  constructor({
    provider,
    instanceId,
    config,
  }: {
    provider: AmazonConnectService;
    instanceId: string;
    config: ServiceConfig;
  }) {
    super(provider);
    this.instanceId = instanceId;
    this.config = config;
  }
}

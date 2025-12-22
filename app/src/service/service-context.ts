import { Context } from "@amazon-connect/core";
import { ServiceConfig } from "@amazon-connect/workspace-types";

import { AmazonConnectService } from "./amazon-connect-service";

export class ServiceContext extends Context<AmazonConnectService> {
  public readonly instanceId: string;
  public readonly config: Readonly<ServiceConfig>;
  public readonly region: string;


  constructor({
    provider,
    instanceId,
    config,
    region,
  }: {
    provider: AmazonConnectService;
    instanceId: string;
    config: ServiceConfig;
    region: string;
  }) {
    super(provider);
    this.instanceId = instanceId;
    this.config = config;
    this.region = region;
  }
}

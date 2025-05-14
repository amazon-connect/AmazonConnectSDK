import {
  LifecycleMessage,
  ServiceConfig,
} from "@amazon-connect/workspace-types";

import { AmazonConnectService, ServiceContext } from "../service";
import { LifecycleChangeParams, LifecycleManager } from "./lifecycle-manager";

type ServiceLifecycleChangeParams = LifecycleChangeParams<ServiceContext>;

export class ServiceLifecycleManager extends LifecycleManager<
  AmazonConnectService,
  ServiceContext
> {
  constructor(provider: AmazonConnectService) {
    super(provider);
  }

  handleLifecycleChangeMessage(msg: LifecycleMessage): Promise<void> {
    const context = new ServiceContext({
      provider: this.provider,
      instanceId: msg.instanceId,
      config: msg.config as ServiceConfig,
    });
    this.state.appInstanceId = msg.appInstanceId;
    this.state.instanceId = msg.instanceId;
    this.state.appConfig = msg.appConfig;
    this.state.config = msg.config;

    const params: ServiceLifecycleChangeParams = { context };

    switch (msg.stage) {
      case "create":
        return this.handleCreate(params);
      default:
        this.logger.error("Attempted to send invalid stage to service", {
          stage: msg.stage,
        });
        return Promise.reject(
          new Error(
            "Invalid stage sent to service. Are you using AmazonConnectService for a 3P app? Use AmazonConnectApp",
          ),
        );
    }
  }
}

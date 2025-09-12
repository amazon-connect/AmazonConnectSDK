import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { ModuleContext } from "../context";
import {
  ConnectClientConfig,
  ConnectClientConfigOptional,
} from "./connect-client-config";
import { getModuleContext } from "./get-module-context";

export abstract class ConnectClient {
  protected readonly context: ModuleContext;
  protected readonly namespace: AmazonConnectNamespace;

  constructor(namespace: AmazonConnectNamespace, config: ConnectClientConfig) {
    this.namespace = namespace;
    this.context = getModuleContext({ namespace, config });
  }
}

export abstract class ConnectClientWithOptionalConfig {
  protected readonly context: ModuleContext;
  protected readonly namespace: AmazonConnectNamespace;

  constructor(
    namespace: AmazonConnectNamespace,
    config: ConnectClientConfigOptional,
  ) {
    this.namespace = namespace;
    this.context = getModuleContext({ namespace, config });
  }
}

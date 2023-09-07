import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { Context, ModuleContext } from "../context";
import { ConnectClientConfig } from "./connect-client-config";

export abstract class ConnectClient {
  protected readonly context: ModuleContext;
  protected readonly namespace: AmazonConnectNamespace;

  constructor(
    namespace: AmazonConnectNamespace,
    config: ConnectClientConfig | undefined,
  ) {
    this.namespace = namespace;
    this.context =
      config?.context ??
      new Context(config?.provider).getModuleContext(namespace);
  }
}

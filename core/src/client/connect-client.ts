import { Context, ModuleContext } from "../context";
import { ConnectClientConfig } from "./connect-client-config";

export abstract class ConnectClient {
  protected readonly context: ModuleContext;
  protected readonly moduleName: string;

  constructor(moduleName: string, config: ConnectClientConfig | undefined) {
    this.moduleName = moduleName;
    this.context =
      config?.context ??
      new Context(config?.provider).getModuleContext(moduleName);
  }
}

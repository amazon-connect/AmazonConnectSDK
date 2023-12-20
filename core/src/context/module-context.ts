import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { ConnectLogger, ConnectLoggerFromContextParams } from "../logging";
import { createModuleProxy, ModuleProxy } from "../proxy";
import { Context } from "./context";

export class ModuleContext {
  constructor(
    private readonly engineContext: Context,
    private readonly moduleNamespace: AmazonConnectNamespace,
  ) {}

  private moduleProxy: ModuleProxy | undefined;

  get proxy(): ModuleProxy {
    if (!this.moduleProxy) {
      const proxy = this.engineContext.getProxy();
      const moduleNamespace = this.moduleNamespace;
      this.moduleProxy = createModuleProxy(proxy, moduleNamespace);
    }
    return this.moduleProxy;
  }

  createLogger(params: ConnectLoggerFromContextParams): ConnectLogger {
    return this.engineContext.createLogger(params);
  }
}

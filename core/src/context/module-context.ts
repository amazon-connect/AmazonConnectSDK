import { ConnectLogger, ConnectLoggerFromContextParams } from "../logging";
import { ModuleKey } from "../module";
import { ModuleProxy } from "../proxy";
import { createModuleProxy } from "../proxy";
import { Context } from "./context";

export class ModuleContext {
  constructor(
    private readonly engineContext: Context,
    private readonly module: ModuleKey
  ) {}

  private moduleProxy: ModuleProxy | undefined;

  get proxy(): ModuleProxy {
    if (!this.moduleProxy) {
      const proxy = this.engineContext.getProxy();
      const module = this.module;
      this.moduleProxy = createModuleProxy(proxy, module);
    }
    return this.moduleProxy;
  }

  createLogger(params: ConnectLoggerFromContextParams): ConnectLogger {
    return this.engineContext.createLogger(params);
  }
}

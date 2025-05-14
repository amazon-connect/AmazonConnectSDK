import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { ConnectLogger, ConnectLoggerFromContextParams } from "../logging";
import {
  ConnectMetricRecorder,
  ConnectMetricRecorderFromContextParams,
} from "../metric";
import { AmazonConnectProvider } from "../provider";
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
      const proxy = this.engineContext.getProvider().getProxy();
      const moduleNamespace = this.moduleNamespace;
      this.moduleProxy = createModuleProxy(proxy, moduleNamespace);
    }
    return this.moduleProxy;
  }

  getProvider(): AmazonConnectProvider {
    return this.engineContext.getProvider();
  }

  createLogger(params: ConnectLoggerFromContextParams): ConnectLogger {
    if (typeof params === "object") {
      return new ConnectLogger({
        ...params,
        provider: () => this.engineContext.getProvider(),
      });
    } else {
      return new ConnectLogger({
        source: params,
        provider: () => this.engineContext.getProvider(),
      });
    }
  }

  createMetricRecorder(
    params: ConnectMetricRecorderFromContextParams,
  ): ConnectMetricRecorder {
    if (typeof params === "object") {
      return new ConnectMetricRecorder({
        ...params,
        provider: () => this.engineContext.getProvider(),
      });
    } else {
      return new ConnectMetricRecorder({
        namespace: params,
        provider: () => this.engineContext.getProvider(),
      });
    }
  }
}

import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { ConnectLogger, ConnectLoggerFromContextParams } from "../logging";
import {
  ConnectMetricRecorder,
  ConnectMetricRecorderFromContextParams,
} from "../metric";
import { AmazonConnectProvider, getGlobalProvider } from "../provider";
import { Proxy } from "../proxy";
import { ModuleContext } from "./module-context";

export class Context<
  TProvider extends AmazonConnectProvider = AmazonConnectProvider,
> {
  private readonly provider: TProvider | undefined;

  constructor(provider?: TProvider) {
    this.provider = provider;
  }

  getProxy(): Proxy {
    return this.getProvider().getProxy();
  }

  getModuleContext(moduleNamespace: AmazonConnectNamespace): ModuleContext {
    return new ModuleContext(this, moduleNamespace);
  }

  getProvider(): TProvider {
    if (this.provider) return this.provider;
    else return getGlobalProvider<TProvider>();
  }

  createLogger(params: ConnectLoggerFromContextParams): ConnectLogger {
    if (typeof params === "object") {
      return new ConnectLogger({
        ...params,
        provider: () => this.getProvider(),
      });
    } else {
      return new ConnectLogger({
        source: params,
        provider: () => this.getProvider(),
      });
    }
  }

  createMetricRecorder(
    params: ConnectMetricRecorderFromContextParams,
  ): ConnectMetricRecorder {
    if (typeof params === "object") {
      return new ConnectMetricRecorder({
        ...params,
        provider: () => this.getProvider(),
      });
    } else {
      return new ConnectMetricRecorder({
        namespace: params,
        provider: () => this.getProvider(),
      });
    }
  }
}

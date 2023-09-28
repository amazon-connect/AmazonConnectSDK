import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { ConnectLogger, ConnectLoggerFromContextParams } from "../logging";
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
    return new ConnectLogger(params);
  }
}

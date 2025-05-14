import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { AmazonConnectProvider, getGlobalProvider } from "../provider";
import { ModuleContext } from "./module-context";

export class Context<
  TProvider extends AmazonConnectProvider = AmazonConnectProvider,
> {
  private readonly _provider: TProvider | undefined;

  constructor(provider?: TProvider) {
    this._provider = provider;
  }

  getProvider(): TProvider {
    if (this._provider) return this._provider;
    else return getGlobalProvider<TProvider>();
  }

  getModuleContext(namespace: AmazonConnectNamespace): ModuleContext {
    return new ModuleContext(this, namespace);
  }
}

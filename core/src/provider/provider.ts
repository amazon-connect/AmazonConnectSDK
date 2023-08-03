import { AmazonConnectConfig } from "../amazon-connect-config";
import { AmazonConnectErrorHandler } from "../amazon-connect-error";
import { Proxy, ProxyFactory } from "../proxy";

export type AmazonConnectProviderParams<TConfig extends AmazonConnectConfig> = {
  config: TConfig;
  proxyFactory: ProxyFactory<TConfig>;
};

export class AmazonConnectProvider<
  TConfig extends AmazonConnectConfig = AmazonConnectConfig
> {
  private readonly proxyFactory: ProxyFactory<TConfig>;
  private readonly _config: TConfig;
  private proxy: Proxy | undefined;

  constructor({ config, proxyFactory }: AmazonConnectProviderParams<TConfig>) {
    if (!proxyFactory) {
      throw new Error("Attempted to get Proxy before setting up factory");
    }

    if (!config) {
      throw new Error("Failed to include config");
    }

    this.proxyFactory = proxyFactory;
    this._config = config;
  }

  getProxy(): Proxy {
    if (!this.proxy) {
      this.proxy = this.proxyFactory(this);

      this.proxy.init();
    }

    return this.proxy;
  }

  get config(): Readonly<TConfig> {
    return { ...this._config };
  }

  onError(handler: AmazonConnectErrorHandler): void {
    this.getProxy().onError(handler);
  }

  offError(handler: AmazonConnectErrorHandler): void {
    this.getProxy().offError(handler);
  }
}

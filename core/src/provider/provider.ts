import { AmazonConnectConfig } from "../amazon-connect-config";
import { AmazonConnectErrorHandler } from "../amazon-connect-error";
import { ConnectLogger } from "../logging";
import { Proxy, ProxyFactory } from "../proxy";
import { generateUUID } from "../utility";
import { setGlobalProvider } from "./global-provider";

export type AmazonConnectProviderParams<TConfig extends AmazonConnectConfig> = {
  config: TConfig;
  proxyFactory: ProxyFactory<TConfig>;
};

export class AmazonConnectProvider<
  TConfig extends AmazonConnectConfig = AmazonConnectConfig,
> {
  private readonly _id: string;
  private readonly proxyFactory: ProxyFactory<TConfig>;
  private readonly _config: TConfig;
  private proxy: Proxy | undefined;

  constructor({ config, proxyFactory }: AmazonConnectProviderParams<TConfig>) {
    this._id = generateUUID();

    if (!proxyFactory) {
      throw new Error("Attempted to get Proxy before setting up factory");
    }

    if (!config) {
      throw new Error("Failed to include config");
    }

    this.proxyFactory = proxyFactory;
    this._config = config;
  }

  get id(): string {
    return this._id;
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

  protected static isInitialized = false;

  protected static initializeProvider<TProvider extends AmazonConnectProvider>(
    provider: TProvider,
  ): TProvider {
    const logger = new ConnectLogger({
      source: "core.amazonConnect.init",
      provider,
    });

    if (this.isInitialized) {
      const msg = "Error: Attempted to initialize provider more than one time.";
      logger.error(msg);
      throw new Error(msg);
    }

    setGlobalProvider(provider);

    this.isInitialized = true;

    // Getting the proxy sets up the connection with subject
    provider.getProxy();

    return provider;
  }
}

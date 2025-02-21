import { AmazonConnectConfig } from "../amazon-connect-config";
import { AmazonConnectErrorHandler } from "../amazon-connect-error";
import { ConnectError } from "../error";
import { ConnectLogger } from "../logging";
import { Proxy, ProxyFactory } from "../proxy";
import { generateUUID } from "../utility";
import { getGlobalProvider, setGlobalProvider } from "./global-provider";
import { AmazonConnectProvider } from "./provider";

export type AmazonConnectProviderParams<TConfig extends AmazonConnectConfig> = {
  config: TConfig;
  proxyFactory: ProxyFactory<AmazonConnectProvider<TConfig>>;
};

export class AmazonConnectProviderBase<
  TConfig extends AmazonConnectConfig = AmazonConnectConfig,
> implements AmazonConnectProvider<TConfig>
{
  private readonly _id: string;
  private readonly proxyFactory: ProxyFactory<this>;
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

  protected static initializeProvider<
    TProvider extends AmazonConnectProviderBase,
  >(provider: TProvider): TProvider {
    if (this.isInitialized) {
      const msg = "Attempted to initialize provider more than one time.";
      const details: Record<string, string> = {};

      try {
        // Attempts to get the existing provider for logging
        const existingProvider = getGlobalProvider();

        const logger = new ConnectLogger({
          source: "core.amazonConnectProvider.init",
          provider: existingProvider,
        });

        logger.error(msg);
      } catch (e) {
        // In the event of a error when logging or attempting
        // to get provider when logging, capture the message
        // in the error being thrown
        details.loggingError = (e as Error)?.message;
      }

      throw new ConnectError({
        errorKey: "attemptInitializeMultipleProviders",
        reason: msg,
        details,
      });
    }

    setGlobalProvider(provider);

    this.isInitialized = true;

    // Getting the proxy sets up the connection with subject
    provider.getProxy();

    return provider;
  }
}

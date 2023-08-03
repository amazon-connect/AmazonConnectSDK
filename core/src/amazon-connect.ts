import { ConnectLogger } from "./logging";
import {
  AmazonConnectProvider,
  getGlobalProvider,
  setGlobalProvider,
} from "./provider";

export abstract class AmazonConnect {
  protected static isInitialized = false;

  protected static initBase<
    TProvider extends AmazonConnectProvider = AmazonConnectProvider
  >(provider: TProvider): TProvider {
    const logger = new ConnectLogger({
      source: "core.amazonConnect.init",
      provider,
    });

    if (this.isInitialized) {
      logger.warn("Already initialized. Ignoring");
      return getGlobalProvider<TProvider>();
    }

    setGlobalProvider(provider);

    this.isInitialized = true;

    // Getting the proxy sets up the connection with subject
    provider.getProxy();

    return provider;
  }
}

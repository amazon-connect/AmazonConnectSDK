import { AmazonConnectProvider, getGlobalProvider } from "@amazon-connect/core";

import { AmazonConnectStreamsSiteConfig } from "./amazon-connect-streams-site-config";
import { StreamsSiteProxy } from "./streams-site-proxy";

export class AmazonConnectStreamsSite extends AmazonConnectProvider<AmazonConnectStreamsSiteConfig> {
  private constructor(config: AmazonConnectStreamsSiteConfig) {
    super({
      config,
      proxyFactory: (p) => new StreamsSiteProxy(p as AmazonConnectStreamsSite),
    });
  }

  static init(config: AmazonConnectStreamsSiteConfig): {
    provider: AmazonConnectStreamsSite;
  } {
    const provider = new AmazonConnectStreamsSite(config);

    AmazonConnectStreamsSite.initializeProvider(provider);

    return { provider };
  }

  static get default(): AmazonConnectStreamsSite {
    return getGlobalProvider<AmazonConnectStreamsSite>(
      "AmazonConnectStreamsSite has not been initialized",
    );
  }

  setCCPIframe(iframe: HTMLIFrameElement): void {
    (this.getProxy() as StreamsSiteProxy).setCCPIframe(iframe);
  }
}

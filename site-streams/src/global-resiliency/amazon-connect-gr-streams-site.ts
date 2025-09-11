import {
  AmazonConnectProviderBase,
  getGlobalProvider,
} from "@amazon-connect/core";

import { AmazonConnectGRStreamsSiteConfig } from "./amazon-connect-gr-streams-site-config";
import { GlobalResiliencyProxy } from "./global-resiliency-proxy";
import {
  GlobalResiliencyRegion,
  GlobalResiliencyRegionIframe,
} from "./global-resiliency-region";

export class AmazonConnectGRStreamsSite extends AmazonConnectProviderBase<AmazonConnectGRStreamsSiteConfig> {
  private constructor(config: AmazonConnectGRStreamsSiteConfig) {
    super({
      config,
      proxyFactory: (p) =>
        new GlobalResiliencyProxy(p as AmazonConnectGRStreamsSite),
    });
  }

  static init(config: AmazonConnectGRStreamsSiteConfig): {
    provider: AmazonConnectGRStreamsSite;
  } {
    const provider = new AmazonConnectGRStreamsSite(config);

    AmazonConnectGRStreamsSite.initializeProvider(provider);

    return { provider };
  }

  static get default(): AmazonConnectGRStreamsSite {
    return getGlobalProvider<AmazonConnectGRStreamsSite>(
      "AmazonConnectGRStreamsSite has not been initialized",
    );
  }

  // This should be called for each region on startup
  setCCPIframe(iframe: GlobalResiliencyRegionIframe): void {
    (this.getProxy() as GlobalResiliencyProxy).setCCPIframe(iframe);
  }

  setActiveRegion(region: GlobalResiliencyRegion): void {
    (this.getProxy() as GlobalResiliencyProxy).setActiveRegion(region);
  }
}

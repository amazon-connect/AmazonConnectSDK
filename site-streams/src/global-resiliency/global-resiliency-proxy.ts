import {
  AddChildChannelDirectParams,
  AddChildChannelPortParams,
  ConnectLogger,
  getOriginAndPath,
  Proxy,
  UpstreamMessage,
} from "@amazon-connect/core";
import { UpdateChannelPortParams } from "@amazon-connect/core/lib/proxy/channel-manager";

import { AmazonConnectGRStreamsSite } from "./amazon-connect-gr-streams-site";
import { AmazonConnectGRStreamsSiteConfig } from "./amazon-connect-gr-streams-site-config";
import {
  GlobalResiliencyRegion,
  GlobalResiliencyRegionIframe,
} from "./global-resiliency-region";
import { GlobalResiliencyStreamsSiteMessageOrigin } from "./global-resiliency-streams-site-message-origin";
import { RegionalProxy } from "./regional-proxy";
import { verifyRegion } from "./verify-region";

export class GlobalResiliencyProxy extends Proxy<AmazonConnectGRStreamsSiteConfig> {
  private readonly proxyLogger: ConnectLogger;

  private activeRegion: GlobalResiliencyRegion;
  private regionProxies: { [K in GlobalResiliencyRegion]: RegionalProxy };

  constructor(provider: AmazonConnectGRStreamsSite) {
    super(provider);

    this.activeRegion = GlobalResiliencyRegion.Primary;
    this.regionProxies = {
      [GlobalResiliencyRegion.Primary]: new RegionalProxy({
        provider,
        region: GlobalResiliencyRegion.Primary,
        getUpstreamMessageOrigin: this.getUpstreamMessageOrigin.bind(this),
        relayToGlobalResiliencyProxy: this.handleMessageFromSubject.bind(this),
      }),
      [GlobalResiliencyRegion.Secondary]: new RegionalProxy({
        provider,
        region: GlobalResiliencyRegion.Secondary,
        getUpstreamMessageOrigin: this.getUpstreamMessageOrigin.bind(this),
        relayToGlobalResiliencyProxy: this.handleMessageFromSubject.bind(this),
      }),
    };

    this.proxyLogger = new ConnectLogger({
      source: "globalResiliencyProxy",
      provider,
    });
  }

  protected initProxy(): void {
    Object.values(this.regionProxies).forEach((proxy) => proxy.init());
  }

  setCCPIframe({ iframe, region }: GlobalResiliencyRegionIframe): void {
    verifyRegion(region);
    this.regionProxies[region].setCCPIframe(iframe);
  }

  setActiveRegion(region: GlobalResiliencyRegion): void {
    verifyRegion(region);

    if (region !== this.activeRegion) {
      const previousRegionProxy = this.regionProxies[this.activeRegion];
      const currentRegionProxy = this.regionProxies[region];

      // Removes subscriptions from original engine
      this.unsubscribeAllHandlers();

      this.proxyLogger.info("Active region changed", {
        current: region,
        instanceUrl: currentRegionProxy.instanceUrl,
        previousInstanceUrl: previousRegionProxy.instanceUrl,
      });

      this.activeRegion = region;

      // Adds subscriptions to new engine
      this.restoreAllHandler();

      const currentStatus = this.status.getStatus();
      const activeRegionStatus = currentRegionProxy.connectionStatus;

      switch (activeRegionStatus) {
        case "ready":
          this.proxyLogger.info("Active region is ready", {
            activeRegionStatus,
          });
          this.status.update({
            status: "ready",
            connectionId: currentRegionProxy["connectionId"] as string,
          });
          break;

        case "connecting":
        case "initializing":
          if (currentStatus !== activeRegionStatus) {
            this.status.update({ status: activeRegionStatus });
          }
          break;
        case "error":
          if (currentStatus !== activeRegionStatus) {
            this.status.update({
              status: "error",
              reason: "new active region in error on transition",
              details: { region: this.activeRegion },
            });
          }
          break;
      }
    }
  }

  get proxyType(): string {
    return "global-resiliency-proxy";
  }

  // Override the normal sendOrQueueMessageToSubject to rely on the
  // of the regional proxy
  protected sendOrQueueMessageToSubject(message: UpstreamMessage): void {
    this.regionProxies[this.activeRegion].sendOrQueueMessageToSubject(message);
  }

  protected addContextToLogger(): Record<string, unknown> {
    return { activeRegion: this.activeRegion };
  }

  // When sending a message, it goes to the sendOrQueueMessageToSubject of the
  // active region
  protected sendMessageToSubject(message: UpstreamMessage): void {
    this.regionProxies[this.activeRegion].sendOrQueueMessageToSubject(message);
  }

  protected getUpstreamMessageOrigin(): GlobalResiliencyStreamsSiteMessageOrigin {
    return {
      _type: "global-resiliency-streams-site",
      providerId: this.provider.id,
      ...getOriginAndPath(),
      activeRegion: this.activeRegion,
    };
  }

  addChildIframeChannel(params: AddChildChannelPortParams): void {
    this.regionProxies[this.activeRegion].addChildIframeChannel(params);
  }

  addChildComponentChannel(params: AddChildChannelDirectParams): void {
    this.regionProxies[this.activeRegion].addChildComponentChannel(params);
  }

  updateChildIframeChannelPort(params: UpdateChannelPortParams): void {
    this.regionProxies[this.activeRegion].updateChildIframeChannelPort(params);
  }
}

import {
  ChildConnectionEnabledDownstreamMessage,
  ErrorMessage,
  PublishMessage,
  ResponseMessage,
  UpstreamMessage,
} from "@amazon-connect/core";
import { SiteProxy } from "@amazon-connect/site";

import { AmazonConnectGRStreamsSite } from "./amazon-connect-gr-streams-site";
import { AmazonConnectGRStreamsSiteConfig } from "./amazon-connect-gr-streams-site-config";
import { GlobalResiliencyRegion } from "./global-resiliency-region";
import { GlobalResiliencyStreamsSiteMessageOrigin } from "./global-resiliency-streams-site-message-origin";

export type GlobalHandledDownstreamMessage =
  | ResponseMessage
  | PublishMessage
  | ErrorMessage;

export type RelayToGlobalResiliencyProxy = (
  msg: GlobalHandledDownstreamMessage,
) => void;

export interface RegionalProxyParams {
  provider: AmazonConnectGRStreamsSite;
  region: GlobalResiliencyRegion;
  getUpstreamMessageOrigin: () => GlobalResiliencyStreamsSiteMessageOrigin;
  relayToGlobalResiliencyProxy: RelayToGlobalResiliencyProxy;
}

export class RegionalProxy extends SiteProxy<AmazonConnectGRStreamsSiteConfig> {
  private ccpIFrame: HTMLIFrameElement | null;
  public readonly region: GlobalResiliencyRegion;
  private unexpectedIframeWarningCount: number;
  private readonly getParentUpstreamMessageOrigin: () => GlobalResiliencyStreamsSiteMessageOrigin;
  private readonly relayToGlobalResiliencyProxy: RelayToGlobalResiliencyProxy;

  constructor({
    provider,
    region,
    getUpstreamMessageOrigin,
    relayToGlobalResiliencyProxy,
  }: RegionalProxyParams) {
    super(
      provider,
      region === GlobalResiliencyRegion.Primary
        ? provider.config.primaryInstanceUrl
        : provider.config.secondaryInstanceUrl,
    );
    this.getParentUpstreamMessageOrigin = getUpstreamMessageOrigin;
    this.relayToGlobalResiliencyProxy = relayToGlobalResiliencyProxy;
    this.ccpIFrame = null;
    this.region = region;
    this.unexpectedIframeWarningCount = 0;
  }

  get proxyType(): string {
    return "acgr-regional-proxy";
  }

  setCCPIframe(iframe: HTMLIFrameElement): void {
    const isCcpIFrameSet = Boolean(this.ccpIFrame);

    this.ccpIFrame = iframe;
    this.unexpectedIframeWarningCount = 0;

    if (isCcpIFrameSet) this.resetConnection("CCP IFrame Updated");
  }

  protected handleMessageFromSubject(
    msg: ChildConnectionEnabledDownstreamMessage,
  ): void {
    switch (msg.type) {
      case "response":
      case "publish":
      case "error":
        this.relayToGlobalResiliencyProxy(msg);
        break;
      default:
        // All other messages handled by this proxy
        super.handleMessageFromSubject(msg);
    }
  }

  protected getUpstreamMessageOrigin(): GlobalResiliencyStreamsSiteMessageOrigin {
    return this.getParentUpstreamMessageOrigin();
  }

  protected verifyEventSource(
    evt: MessageEvent<{ type?: string | undefined }>,
  ): boolean {
    const ccpIFrame = this.ccpIFrame;

    if (!ccpIFrame) {
      this.proxyLogger.error(
        "CCP Iframe not provided to proxy. Unable to verify event to Connect to CCP.",
        {
          origin: evt.origin,
        },
      );
      return false;
    }

    const valid = evt.source === ccpIFrame.contentWindow;

    if (!valid) {
      this.unexpectedIframeWarningCount++;

      if (this.unexpectedIframeWarningCount < 5) {
        this.proxyLogger.warn(
          "Message came from unexpected iframe. Not a valid CCP. Will not connect",
          {
            origin: evt.origin,
            unexpectedIframeWarningCount: this.unexpectedIframeWarningCount,
          },
        );
      }
    }

    return valid;
  }

  sendOrQueueMessageToSubject(message: UpstreamMessage): void {
    super.sendOrQueueMessageToSubject(message);
  }

  protected invalidInitMessageHandler(): void {
    // CCP sends messages via Streams
    // Take no action here
  }
}

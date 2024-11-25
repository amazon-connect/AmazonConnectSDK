import { getOriginAndPath } from "@amazon-connect/core";
import { SiteProxy } from "@amazon-connect/site";

import { AmazonConnectStreamsSite } from "./amazon-connect-streams-site";
import { AmazonConnectStreamsSiteConfig } from "./amazon-connect-streams-site-config";
import { StreamsSiteMessageOrigin } from "./streams-site-message-origin";

export class StreamsSiteProxy extends SiteProxy<AmazonConnectStreamsSiteConfig> {
  private ccpIFrame: HTMLIFrameElement | null;

  constructor(provider: AmazonConnectStreamsSite) {
    super(provider);

    this.ccpIFrame = null;
  }

  get proxyType(): string {
    return "streams-site";
  }

  setCCPIframe(iframe: HTMLIFrameElement): void {
    const isCcpIFrameSet = Boolean(this.ccpIFrame);

    this.ccpIFrame = iframe;

    if (isCcpIFrameSet) this.resetConnection("CCP IFrame Updated");
  }

  protected getUpstreamMessageOrigin(): StreamsSiteMessageOrigin {
    return {
      _type: "streams-site",
      providerId: this.provider.id,
      ...getOriginAndPath(),
    };
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
      this.proxyLogger.warn(
        "Message came from unexpected iframe. Not a valid CCP. Will not connect",
        {
          origin: evt.origin,
        },
      );
    }

    return valid;
  }

  protected invalidInitMessageHandler(): void {
    // CCP sends messages via Streams
    // Take no action here
  }
}
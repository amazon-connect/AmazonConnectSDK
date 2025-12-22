import { IFrameAppConfig } from "@amazon-connect/workspace-types";

import { IFrameRunner } from "../../host";
import { IFrameHost } from "../../host/host";
import { AppHost } from "./app-host";
import { AppHostParams } from "./app-host-params";
import { SetIframeOptions } from "./set-iframe-options";

export class IFrameAppHost
  extends AppHost<IFrameAppConfig>
  implements IFrameHost<AppHost<IFrameAppConfig>>
{
  private readonly iframeRunner: IFrameRunner;

  constructor(params: AppHostParams) {
    super(params);
    this.iframeRunner = new IFrameRunner({
      instanceId: this.instanceId,
      config: this.config,
      connectionId: this.connectionId,
      hostStateManager: this.hostStateManager,
      provider: params.provider,
    });
  }

  get iframe(): HTMLIFrameElement | undefined {
    return this.iframeRunner.iframe;
  }

  setIFrame(iframe: HTMLIFrameElement, setIframeOptions?: SetIframeOptions) {
    this.iframeRunner.setIFrame(iframe, setIframeOptions);
  }
}

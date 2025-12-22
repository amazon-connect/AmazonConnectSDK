import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { themeNamespace } from "./namespace";
import { ThemeRoutes } from "./routes";
import { Theme } from "./types";

export class ThemeClient extends ConnectClient {
  constructor(config: ConnectClientConfig) {
    super(themeNamespace, config || {});
  }

  async getTheme(): Promise<Theme> {
    const theme = await this.context.proxy.request<Theme>(ThemeRoutes.getTheme);
    return theme;
  }
}

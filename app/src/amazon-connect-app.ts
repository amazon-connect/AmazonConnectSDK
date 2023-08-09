import { AmazonConnect } from "@amzn/amazon-connect-sdk-core";

import { AmazonConnectAppConfig } from "./amazon-connect-app-config";
import { AmazonConnectAppProvider } from "./app-provider";

export abstract class AmazonConnectApp extends AmazonConnect {
  static init(config: AmazonConnectAppConfig): {
    provider: AmazonConnectAppProvider;
  } {
    const provider = new AmazonConnectAppProvider(config);

    return { provider: this.initBase(provider) };
  }
}

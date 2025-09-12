import { ModuleContext } from "../context";
import { AmazonConnectProvider } from "../provider";

export type ConnectClientConfig =
  | AmazonConnectProvider
  | {
      context: ModuleContext;
      provider?: AmazonConnectProvider;
    }
  | {
      provider: AmazonConnectProvider;
    };

export type ConnectClientConfigDeprecated =
  | undefined
  | {
      context?: undefined;
      provider?: AmazonConnectProvider;
    };

export type ConnectClientConfigOptional =
  | ConnectClientConfig
  | ConnectClientConfigDeprecated;

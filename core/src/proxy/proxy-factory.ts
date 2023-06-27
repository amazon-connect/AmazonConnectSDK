import { AmazonConnectConfig } from "../amazon-connect-config";
import { AmazonConnectProvider } from "../provider";
import { Proxy } from "./proxy";

export type ProxyFactory<TConfig extends AmazonConnectConfig> = (
  provider: AmazonConnectProvider<TConfig>
) => Proxy;

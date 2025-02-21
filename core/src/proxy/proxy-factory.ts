import { AmazonConnectProvider } from "../provider";
import { Proxy } from "./proxy";

export type ProxyFactory<TProvider extends AmazonConnectProvider> = (
  provider: TProvider,
) => Proxy;

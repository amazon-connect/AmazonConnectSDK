import { AmazonConnectConfig } from "../amazon-connect-config";
import { AmazonConnectErrorHandler } from "../amazon-connect-error";
import { Proxy } from "../proxy";

export interface AmazonConnectProvider<
  TConfig extends AmazonConnectConfig = AmazonConnectConfig,
> {
  get id(): string;
  get config(): Readonly<TConfig>;

  getProxy(): Proxy;

  onError(handler: AmazonConnectErrorHandler): void;
  offError(handler: AmazonConnectErrorHandler): void;
}

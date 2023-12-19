import { AmazonConnectConfig } from "../amazon-connect-config";
import { LogProxy } from "./log-proxy";

export interface LogProvider {
  getProxy(): LogProxy;
  get config(): Readonly<AmazonConnectConfig>;
}

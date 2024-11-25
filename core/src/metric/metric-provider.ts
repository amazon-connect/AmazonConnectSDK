import { AmazonConnectConfig } from "../amazon-connect-config";
import { MetricProxy } from "./metric-proxy";
export interface MetricProvider {
  getProxy(): MetricProxy;
  get config(): Readonly<AmazonConnectConfig>;
}

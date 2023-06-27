import { ModuleContext } from "../context";
import { AmazonConnectProvider } from "../provider";

export type ConnectClientConfig = {
  context?: ModuleContext;
  provider?: AmazonConnectProvider;
};

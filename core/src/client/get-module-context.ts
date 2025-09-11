import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { Context, ModuleContext } from "../context";
import { isAmazonConnectProvider } from "../provider";
import { ConnectClientConfigOptional } from "./connect-client-config";

export function getModuleContext({
  namespace,
  config,
}: {
  namespace: AmazonConnectNamespace;
  config: ConnectClientConfigOptional;
}): ModuleContext {
  if (config && "context" in config && config.context) {
    return config.context;
  } else if (isAmazonConnectProvider(config)) {
    return new Context(config).getModuleContext(namespace);
  } else {
    return new Context(config?.provider).getModuleContext(namespace);
  }
}

import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { ModuleProxy } from "./module-proxy";
import { Proxy } from "./proxy";

export function createModuleProxy(
  proxy: Proxy,
  namespace: AmazonConnectNamespace
): ModuleProxy {
  return {
    subscribe: (topic, handler) =>
      proxy.subscribe({ ...topic, namespace }, handler),
    unsubscribe: (topic, handler) =>
      proxy.unsubscribe({ ...topic, namespace }, handler),
    getProxyInfo: () => ({
      connectionStatus: proxy.connectionStatus,
      proxyType: proxy.proxyType,
    }),
    onConnectionStatusChange: (h) => proxy.onConnectionStatusChange(h),
    offConnectionStatusChange: (h) => proxy.offConnectionStatusChange(h),
  };
}

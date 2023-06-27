import { ModuleKey } from "../module";
import { ModuleProxy } from "./module-proxy";
import { Proxy } from "./proxy";

export function createModuleProxy(
  proxy: Proxy,
  module: ModuleKey
): ModuleProxy {
  return {
    subscribe: (topic, handler) =>
      proxy.subscribe({ ...topic, module }, handler),
    unsubscribe: (topic, handler) =>
      proxy.unsubscribe({ ...topic, module }, handler),
    getProxyInfo: () => ({
      connectionStatus: proxy.connectionStatus,
      proxyType: proxy.proxyType,
    }),
    onConnectionStatusChange: (h) => proxy.onConnectionStatusChange(h),
    offConnectionStatusChange: (h) => proxy.offConnectionStatusChange(h),
  };
}

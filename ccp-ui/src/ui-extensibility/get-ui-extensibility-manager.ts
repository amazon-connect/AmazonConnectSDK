import {
  AmazonConnectNamespace,
  AmazonConnectProvider,
} from "@amazon-connect/core";

import { UIExtensibilityManager } from "./ui-extensibility-manager";

const map = new Map<
  AmazonConnectNamespace,
  Map<string, UIExtensibilityManager>
>();

export function getUIExtensibilityManager(
  namespace: AmazonConnectNamespace,
  provider: AmazonConnectProvider,
): UIExtensibilityManager {
  let providerMap = map.get(namespace);

  if (!providerMap) {
    providerMap = new Map<string, UIExtensibilityManager>();
    map.set(namespace, providerMap);
  }

  let manager = providerMap.get(provider.id);

  if (!manager) {
    manager = new UIExtensibilityManager({ namespace, provider });
    providerMap.set(provider.id, manager);
  }

  return manager;
}

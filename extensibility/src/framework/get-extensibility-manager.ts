import {
  AmazonConnectNamespace,
  AmazonConnectProvider,
} from "@amazon-connect/core";

import { ExtensibilityManager } from "./extensibility-manager";

const map = new Map<
  AmazonConnectNamespace,
  Map<string, ExtensibilityManager>
>();

export function getExtensibilityManager(
  namespace: AmazonConnectNamespace,
  provider: AmazonConnectProvider,
): ExtensibilityManager {
  let providerMap = map.get(namespace);

  if (!providerMap) {
    providerMap = new Map<string, ExtensibilityManager>();
    map.set(namespace, providerMap);
  }

  let manager = providerMap.get(provider.id);

  if (!manager) {
    manager = new ExtensibilityManager({ namespace, provider });
    providerMap.set(provider.id, manager);
  }

  return manager;
}

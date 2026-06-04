import { AmazonConnectProvider } from "@amazon-connect/core";

/**
 * Global plugin keys that will be added to all app managers on the same thread.
 *
 * @remarks
 * Plugins added here apply to **every** app manager initialized on the same
 * thread. If a page contains child partitions — each with their own provider
 * and their own app manager — this list will be applied to all of them.
 *
 * If you need a plugin applied to only a single app manager, use the
 * `appManager.plugins` option on the `init` call that creates the specific
 * provider instead.
 *
 * @see {@link AppManagerConfig.plugins} for per-provider scoped plugins.
 */
const globalPlugins: string[] = [];

/**
 * Adds a plugin key to the global list of plugins applied to **all** app
 * managers on the same thread.
 *
 * @remarks
 * Because this list is shared across all providers on the same thread, adding
 * a plugin here will affect every app manager on the page, including those in
 * child partitions that have their own provider. If you want to scope a plugin
 * to a single app manager, use the `appManager.plugins` option on the `init`
 * call for that specific provider instead.
 *
 * @param pluginName - The plugin key to register globally.
 */
export function addAppManagerPluginKey(pluginName: string): void {
  globalPlugins.push(pluginName);
}

/**
 * Returns the deduplicated union of global plugins and any provider-scoped
 * plugins set in the provider's `appManager.plugins` config.
 *
 * @remarks
 * Global plugins (registered via `addAppManagerPluginKey`) are merged with
 * provider-scoped plugins from `provider.config.appManager.plugins`. Duplicates
 * appearing in both sources are removed so each plugin key appears only once.
 *
 * @param provider - The provider whose config is used for scoped plugins.
 * @returns A deduplicated array of plugin keys to register with the app manager.
 */
export function getProviderPlugins(provider: AmazonConnectProvider): string[] {
  const providerPlugins = provider.config?.appManager?.plugins ?? [];
  return [...new Set([...globalPlugins, ...providerPlugins])];
}

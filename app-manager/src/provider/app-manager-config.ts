/**
 * Configuration options specific to a single app manager provider instance.
 *
 * These settings apply only to the app manager created by the provider being
 * initialized. If a page has multiple child partitions, each with their own
 * provider and app manager, this configuration will only affect the provider
 * it is passed to.
 *
 * @example
 * ```typescript
 * AmazonConnectProvider.init({
 *   appManager: {
 *     plugins: ["my-plugin"],
 *   },
 * });
 * ```
 */
export interface AppManagerConfig {
  /**
   * A list of plugin keys to register with this specific app manager instance.
   *
   * Unlike `addAppManagerPluginKey`, which adds plugins globally to all app
   * managers on the same thread, plugins provided here are scoped exclusively
   * to the app manager created by the provider being initialized.
   *
   * Use this option when you want a plugin applied to a single provider's app
   * manager rather than every app manager on the page.
   */
  plugins?: string[];
}

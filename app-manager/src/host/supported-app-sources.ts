const supportedAppSources = new Set([
  "customerprofiles",
  "wisdom",
  "wisdom_content",
  "cases",
  "keystone",
  "scheduling",
  "customviews",
  "ccp",
  "screenshare",
]);

/**
 * Checks if a message event is from a supported app source.
 *
 * @param evt - The message event to check
 * @returns true if the event is from a supported app source, false otherwise
 */
export function isSupportedAppSource(
  evt: MessageEvent<{ type?: string; source?: string }>,
): boolean {
  return Boolean(evt.data?.source && supportedAppSources.has(evt.data.source));
}

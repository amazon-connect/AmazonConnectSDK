/**
 * Global routing origin validation patterns for Amazon Connect instances.
 * These patterns validate origins that support cross-region functionality.
 */

/**
 * Production global routing origin pattern.
 * Matches: https://{region}.{instance-alias}.my.connect.aws
 * Example: https://us-west-2.instance1.my.connect.aws
 */
const GLOBAL_ROUTING_PRODUCTION_ORIGIN_PATTERN =
  /^https:\/\/([a-z]{2,3}-[a-z]{3,12}-[1-9]\d?)\.([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.my\.connect\.aws$/;

/**
 * Non-production global routing origin pattern.
 * Matches: https://{region}.{instance-alias}.my.{stage}.global.nonprod.connect.aws.a2z.com
 * Example: https://us-west-2.instance1.my.gamma.global.nonprod.connect.aws.a2z.com
 */
const GLOBAL_ROUTING_NONPROD_ORIGIN_PATTERN =
  /^https:\/\/([a-z]{2,3}-[a-z]{3,12}-[1-9]\d?)\.([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.my\.([a-z]{1,20})\.global\.nonprod\.connect\.aws\.a2z\.com$/;

/**
 * Region prefix extraction pattern for origin strings.
 * Extracts the base domain after removing the region prefix.
 * Example: https://us-west-2.instance1.my.connect.aws -> instance1.my.connect.aws
 */
const REGION_PREFIX_ORIGIN_PATTERN = /^https:\/\/[a-z]{2,3}-[a-z]{3,12}-[1-9]\d?\.(.+)$/;

/**
 * Validates if an origin matches either production or non-production global routing patterns.
 * @param origin - The origin string to validate
 * @returns True if the origin matches global routing patterns, false otherwise
 */
const isValidRegionalOrigin = (origin: string): boolean => {
  return GLOBAL_ROUTING_PRODUCTION_ORIGIN_PATTERN.test(origin) || GLOBAL_ROUTING_NONPROD_ORIGIN_PATTERN.test(origin);
};

/**
 * Determines whether two origins should be allowed to communicate with each other.
 * This validates cross-region communication by ensuring both origins are valid
 * global routing domains with the same base domain (after removing region prefix).
 *
 * @param eventOrigin - The origin from the message event
 * @param expectedOrigin - The expected origin from configuration
 * @returns True if the origins should be allowed to communicate
 */
export function isValidRegionalOriginPair(eventOrigin: string, expectedOrigin: string): boolean {
  // Handle null/undefined values early
  if (!eventOrigin || !expectedOrigin) {
    return false;
  }

  const eventMatch = eventOrigin.match(REGION_PREFIX_ORIGIN_PATTERN);
  const expectedMatch = expectedOrigin.match(REGION_PREFIX_ORIGIN_PATTERN);

  if (!eventMatch || !expectedMatch) {
    return false;
  }

  return (
    isValidRegionalOrigin(eventOrigin) && isValidRegionalOrigin(expectedOrigin) && eventMatch[1] === expectedMatch[1]
  );
}

import { AmazonConnectProvider } from "./provider";

/**
 * Type guard to verify that a value represents an AmazonConnectProvider interface.
 * Checks for the presence of required getters and methods without performing
 * runtime validation of the on/off error handling functionality.
 */

/**
 * Type guard function that verifies if a given value implements the
 * basic AmazonConnectProvider interface structure.
 *
 * @param value - The value to check for provider interface compliance
 * @returns True if the value has the required provider interface properties
 *
 * @example
 * ```typescript
 * const someValue = getUnknownValue();
 * if (isAmazonConnectProvider(someValue)) {
 *   // someValue is now typed as having provider interface
 *   console.log(someValue.id);
 *   const proxy = someValue.getProxy();
 * }
 * ```
 */
export function isAmazonConnectProvider(
  value: unknown,
): value is AmazonConnectProvider {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  // Check for id getter - should be a string
  if (typeof candidate.id !== "string") {
    return false;
  }

  // Check for config getter - should exist (any type acceptable)
  if (!("config" in candidate)) {
    return false;
  }

  // Check for getProxy method - should be a function
  if (typeof candidate.getProxy !== "function") {
    return false;
  }

  return true;
}

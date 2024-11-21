import { isConnectError } from "@amazon-connect/core";

import { emailNamespace } from "../email-namespace";

/**
 * Utility function to check if the error is an `OutboundEmailAddressNotConfiguredError`.
 *
 * This error is surfaced when the routing profile's default outbound queue does not have
 * a default outbound email address and the request to `sendEmail` does not include a `from`
 * address. This will only be thrown when `sendEmail` is called.
 *
 * @param {unknown} e the error
 * @returns {boolean} true if the error is an `OutboundEmailAddressNotConfiguredError`, false otherwise
 */
export function isOutboundEmailAddressNotConfiguredError(e: unknown): boolean {
  return (
    isConnectError(e) &&
    e.namespace === emailNamespace &&
    e.errorKey === "OutboundEmailAddressNotConfiguredException"
  );
}

/**
 * Utility function to check if the error is an `EmailBodySizeExceededError`.
 *
 * This error is surfaced when the size of the email body exceeds the limit. This will
 * be thrown when the `sendEmail` method is called.
 *
 * @param {unknown} e the error
 * @returns {boolean} true if the error is an `EmailBodySizeExceededError`, false otherwise
 */
export function isEmailBodySizeExceededError(e: unknown): boolean {
  return (
    isConnectError(e) &&
    e.namespace === emailNamespace &&
    e.errorKey === "EmailBodySizeExceededException"
  );
}
/**
 * Utility function to check if the error is a `TotalEmailSizeExceededError`.
 *
 * This error is surfaced when the total size of the email (email body and all attachments)
 * exceeds the limit. This will be thrown when the `sendEmail` method is called.
 *
 * @param {unknown} e the error
 * @returns {boolean} true if the error is a `TotalEmailSizeExceededError`, false otherwise
 */
export function isTotalEmailSizeExceededError(e: unknown): boolean {
  return (
    isConnectError(e) &&
    e.namespace === emailNamespace &&
    e.errorKey === "TotalEmailSizeExceededException"
  );
}

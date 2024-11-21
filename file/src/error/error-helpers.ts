import { isConnectError } from "@amazon-connect/core";

import { fileNamespace } from "../file-namespace";

/**
 * Utility function to check if the error is an `InvalidFileNameError`.
 *
 * This will be thrown when `startAttachedFileUpload` is called
 *
 * @param {unknown} e the error
 * @returns {boolean} true if the error is an `InvalidFileNameError`, false otherwise
 */
export function isInvalidFileNameError(e: unknown): boolean {
  return (
    isConnectError(e) &&
    e.namespace === fileNamespace &&
    e.errorKey === "InvalidFileNameException"
  );
}

/**
 * Utility function to check if the error is an `InvalidFileTypeError`.
 *
 * This will be thrown when `startAttachedFileUpload` is called
 *
 * @param {unknown} e the error
 * @returns {boolean} true if the error is an `InvalidFileTypeError`, false otherwise
 */
export function isInvalidFileTypeError(e: unknown): boolean {
  return (
    isConnectError(e) &&
    e.namespace === fileNamespace &&
    e.errorKey === "InvalidFileTypeException"
  );
}

/**
 * Utility function to check if the error is an `InvalidFileSizeError`.
 *
 * This will be thrown when `startAttachedFileUpload` is called
 *
 * @param {unknown} e the error
 * @returns {boolean} true if the error is an `InvalidFileSizeError`, false otherwise
 */
export function isInvalidFileSizeError(e: unknown): boolean {
  return (
    isConnectError(e) &&
    e.namespace === fileNamespace &&
    e.errorKey === "InvalidFileSizeException"
  );
}

/**
 * Utility function to check if the error is a `TotalFileSizeExceededError`.
 *
 * This will be thrown when `startAttachedFileUpload` is called
 *
 * @param {unknown} e the error
 * @returns {boolean} true if the error is a `TotalFileSizeExceededError`, false otherwise
 */
export function isTotalFileSizeExceededError(e: unknown): boolean {
  return (
    isConnectError(e) &&
    e.namespace === fileNamespace &&
    e.errorKey === "TotalFileSizeExceededException"
  );
}

/**
 * Utility function to check if the error is a `TotalFileCountExceededError`.
 *
 * This will be thrown when `startAttachedFileUpload` is called
 *
 * @param {unknown} e the error
 * @returns {boolean} true if the error is a `TotalFileCountExceededError`, false otherwise
 */
export function isTotalFileCountExceededError(e: unknown): boolean {
  return (
    isConnectError(e) &&
    e.namespace === fileNamespace &&
    e.errorKey === "TotalFileCountExceededException"
  );
}

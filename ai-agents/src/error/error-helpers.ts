import { ConnectError, isConnectError } from "@amazon-connect/core";

import { aiAgentsNamespace } from "../namespace";

function isAIAgentsError(e: unknown, errorKey: string): e is ConnectError {
  return (
    isConnectError(e) &&
    e.namespace === aiAgentsNamespace &&
    e.errorKey === errorKey
  );
}

/**
 * Checks if the error indicates the contact does not have AI Agent
 * functionality configured.
 * This is a permanent error.
 *
 * @param e - The error to check
 * @returns True if the error is an AIAgentContactNotConfiguredError
 */
export const isAIAgentContactNotConfiguredError = (
  e: unknown,
): e is ConnectError =>
  isAIAgentsError(e, "AIAgentContactNotConfiguredError");

/**
 * Checks if the error indicates AI Agents is not supported for this instance.
 * This is a permanent error.
 *
 * @param e - The error to check
 * @returns True if the error is an AIAgentNotSupportedError
 */
export const isAIAgentNotSupportedError = (
  e: unknown,
): e is ConnectError => isAIAgentsError(e, "AIAgentNotSupportedError");

/**
 * Checks if the error indicates the AI Agent state for the contact could not
 * be resolved in time.
 * This is a transient error — may retry.
 *
 * @param e - The error to check
 * @returns True if the error is an AIAgentContactNotReadyError
 */
export const isAIAgentContactNotReadyError = (
  e: unknown,
): e is ConnectError =>
  isAIAgentsError(e, "AIAgentContactNotReadyError");

/**
 * Checks if the error indicates a knowledge article was not found or removed.
 * This is a permanent error.
 *
 * @param e - The error to check
 * @returns True if the error is a ContentNotFoundError
 */
export const isContentNotFoundError = (e: unknown): e is ConnectError =>
  isAIAgentsError(e, "ContentNotFoundException");

/**
 * Checks if the error indicates throttling by a downstream service.
 * This is a transient error — wait and retry.
 *
 * @param e - The error to check
 * @returns True if the error is a ThrottledError
 */
export const isThrottledError = (e: unknown): e is ConnectError =>
  isAIAgentsError(e, "ThrottledException");

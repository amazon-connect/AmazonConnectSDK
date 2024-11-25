import { ConnectResponseError } from "../request";

export class ConnectError extends Error {
  static readonly ErrorType = "ConnectError";
  readonly errorType = ConnectError.ErrorType;

  readonly errorKey: string;
  readonly namespace: string | undefined;
  readonly details: Record<string, unknown>;
  readonly reason: string | undefined;

  constructor({
    reason,
    namespace,
    errorKey,
    details,
  }:
    | {
        errorKey: string;
        reason?: string;
        namespace?: string;
        details?: Record<string, unknown>;
      }
    | ConnectResponseError) {
    super(`ConnectError with error key "${errorKey}"`);
    this.namespace = namespace;
    this.errorKey = errorKey;
    this.reason = reason;
    this.details = details ?? {};
  }
}

export function isConnectError(error: unknown): error is ConnectError {
  return Boolean(
    error instanceof ConnectError ||
      (error &&
        typeof error === "object" &&
        "errorType" in error &&
        error.errorType === ConnectError.ErrorType),
  );
}

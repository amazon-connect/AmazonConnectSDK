import { ConnectResponseError } from "./request-handlers";

export function formatResponseError(error: ConnectResponseError) {
  return {
    namespace: error.namespace,
    reason: error.reason,
    details: error.details,
    errorKey: error.errorKey,
  };
}

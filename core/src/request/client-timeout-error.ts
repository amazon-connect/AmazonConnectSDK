import { RequestMessage } from "../messaging";

type ClientTimeoutResponseErrorType = "clientTimeout";
export const clientTimeoutResponseErrorKey: ClientTimeoutResponseErrorType =
  "clientTimeout";

export function formatClientTimeoutError(
  request: RequestMessage,
  timeoutMs: number,
) {
  const { namespace, command, data: requestData } = request;

  return {
    namespace,
    reason: "Client Timeout",
    details: {
      command,
      requestData,
      timeoutMs,
    },
    errorKey: clientTimeoutResponseErrorKey,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isClientTimeoutResponseError(err: any): boolean {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof err === "object" && err.errorKey === clientTimeoutResponseErrorKey
  );
}

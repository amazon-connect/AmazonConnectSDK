import { RequestMessage, ResponseMessage } from "../messaging";
import { formatClientTimeoutError } from "./client-timeout-error";
import { formatResponseError } from "./format-response-error";
import { ConnectResponseData } from "./request-handlers";

export type ResponseHandler = (msg: ResponseMessage) => void;

const DEFAULT_TIMEOUT_MS = 30 * 1000;

export function createRequestHandler<TResponse extends ConnectResponseData>(
  request: RequestMessage,
  onStart: (handler: ResponseHandler) => void,
  onTimeout: (details: { timeoutMs: number; request: RequestMessage }) => void,
  timeoutMs?: number,
): Promise<TResponse> {
  const adjustedTimeoutMs = Math.max(1, timeoutMs ?? DEFAULT_TIMEOUT_MS);

  return new Promise<TResponse>((resolve, reject) => {
    let isTimedOut = false;
    const timeout = setTimeout(() => {
      onTimeout({ timeoutMs: adjustedTimeoutMs, request });
      reject(formatClientTimeoutError(request, adjustedTimeoutMs));
      isTimedOut = true;
    }, adjustedTimeoutMs);

    const handler = (msg: ResponseMessage) => {
      clearTimeout(timeout);
      if (!isTimedOut) {
        if (msg.isError) {
          reject(formatResponseError(msg));
        } else {
          resolve(msg.data as TResponse);
        }
      }
    };

    onStart(handler);
  });
}

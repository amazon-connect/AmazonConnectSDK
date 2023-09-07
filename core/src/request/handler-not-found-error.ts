import { ConnectResponseError } from "./request-handlers";

export type HandlerNotFoundResponseErrorType = "handlerNotFound";
export const HandlerNotFoundResponseErrorKey: HandlerNotFoundResponseErrorType =
  "handlerNotFound";
export type HandlerNotFoundResponseError = ConnectResponseError & {
  errorKey: HandlerNotFoundResponseErrorType;
  reason: "No handler for command";
};

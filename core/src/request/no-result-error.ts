import { ConnectResponseError } from "./request-handlers";

export type NoResultResponseErrorType = "noResult";
export const noResultResponseErrorKey: NoResultResponseErrorType = "noResult";
export type NoResultResponseError = ConnectResponseError & {
  errorKey: NoResultResponseErrorType;
  reason: "No Result Found";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNoResultResponseError(err: any): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return typeof err === "object" && err.errorKey === noResultResponseErrorKey;
}

import {
  isNoResultResponseError,
  NoResultResponseError,
} from "./no-result-error";
import { ConnectResponseError } from "./request-handlers";

describe("isNoResultResponseError", () => {
  test("should be false when value is not an object", () => {
    const result = isNoResultResponseError("string");

    expect(result).toBeFalsy();
  });

  test("should be false when error key does not match", () => {
    const otherError: ConnectResponseError = {
      isError: true,
      errorKey: "unknown",
      reason: "foo",
      namespace: "test-namespace",
      requestId: "id",
      details: {
        command: "test-command",
        requestData: undefined,
      },
    };

    const result = isNoResultResponseError(otherError);

    expect(result).toBeFalsy();
  });

  test("should be true when item is NoResultResponseError", () => {
    const error: NoResultResponseError = {
      isError: true,
      errorKey: "noResult",
      reason: "No Result Found",
      namespace: "test-namespace",
      requestId: "id",
      details: {
        command: "test-command",
        requestData: undefined,
      },
    };

    const result = isNoResultResponseError(error);

    expect(result).toBeTruthy();
  });
});

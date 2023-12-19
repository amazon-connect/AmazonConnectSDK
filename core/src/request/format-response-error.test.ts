import { formatResponseError } from "./format-response-error";
import { ConnectResponseError } from "./request-handlers";

describe("formatResponseError", () => {
  test("should return a formatted error", () => {
    const originalError: ConnectResponseError = {
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

    const result = formatResponseError(originalError);

    expect(result.namespace).toEqual(originalError.namespace);
    expect(result.reason).toEqual(originalError.reason);
    expect(result.details).toEqual(originalError.details);
    expect(result.errorKey).toEqual(originalError.errorKey);
  });
});

import { mock } from "jest-mock-extended";

import { RequestMessage, UpstreamMessageOrigin } from "../messaging";
import {
  clientTimeoutResponseErrorKey,
  formatClientTimeoutError,
  isClientTimeoutResponseError,
} from "./client-timeout-error";

describe("formatClientTimeoutError", () => {
  test("should return a ClientTimeoutError", () => {
    const requestMessage: RequestMessage = {
      type: "request",
      namespace: "test-namespace",
      requestId: "id",
      command: "test-command",
      data: { foo: 1 },
      messageOrigin: mock<UpstreamMessageOrigin>(),
    };
    const timeout = 1000;

    const result = formatClientTimeoutError(requestMessage, timeout);

    expect(result.namespace).toEqual(requestMessage.namespace);
    expect(result.reason).toEqual("Client Timeout");
    expect(result.errorKey).toEqual(clientTimeoutResponseErrorKey);
    expect(result.details.command).toEqual(requestMessage.command);
    expect(result.details.requestData).toEqual(requestMessage.data);
    expect(result.details.timeoutMs).toEqual(timeout);
  });
});

describe("isClientTimeoutResponseError", () => {
  test("should be false when value is not an object", () => {
    const result = isClientTimeoutResponseError("string");

    expect(result).toBeFalsy();
  });

  test("should be false when error key does not match", () => {
    const otherError = {
      errorKey: "unknown",
      reason: "foo",
      namespace: "test-namespace",
      details: {
        command: "test-command",
        requestData: undefined,
      },
    };

    const result = isClientTimeoutResponseError(otherError);

    expect(result).toBeFalsy();
  });

  test("should be true when item is NoResultResponseError", () => {
    const error = formatClientTimeoutError(
      {
        type: "request",
        namespace: "test-namespace",
        requestId: "id",
        command: "test-command",
        data: undefined,
        messageOrigin: mock<UpstreamMessageOrigin>(),
      },
      5000,
    );

    const result = isClientTimeoutResponseError(error);

    expect(result).toBeTruthy();
  });
});

import { ConnectError, isConnectError } from "./connect-error";

describe("Connect Error", () => {
  test("should have the correct properties with details", () => {
    const error = new ConnectError({
      reason: "someReason",
      namespace: "test-namespace",
      errorKey: "someErrorKey",
      details: {
        command: "test-command",
        requestData: undefined,
      },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConnectError);
    expect(error.errorKey).toBe("someErrorKey");
    expect(error.reason).toBe("someReason");
    expect(error.namespace).toBe("test-namespace");
    expect(error.details).toStrictEqual({
      command: "test-command",
      requestData: undefined,
    });
    expect(error.message).toContain("someErrorKey");
  });

  test("should have the correct properties without details", () => {
    const error = new ConnectError({
      reason: "someReason",
      namespace: "test-namespace",
      errorKey: "someErrorKey",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConnectError);
    expect(error.errorKey).toBe("someErrorKey");
    expect(error.reason).toBe("someReason");
    expect(error.namespace).toBe("test-namespace");
    expect(error.details).toStrictEqual({});
    expect(error.message).toContain("someErrorKey");
  });
});

describe("isConnectError", () => {
  test("should return true for module error", () => {
    const moduleError = new ConnectError({
      errorKey: "someKey",
      reason: "someReason",
      namespace: "someNamespace",
    });

    const result = isConnectError(moduleError);

    expect(result).toBeTruthy();
  });
  test("should return true for an error with the same type", () => {
    class AltError extends Error {
      readonly errorType = ConnectError.ErrorType;
    }
    const altError = new AltError();

    const result = isConnectError(altError);

    expect(result).toBeTruthy();
  });
  test("should return false for a different type of error", () => {
    const testError = new Error("some error");

    const result = isConnectError(testError);

    expect(result).toBeFalsy();
  });
  test("should return false for a string", () => {
    const result = isConnectError("some error");

    expect(result).toBeFalsy();
  });
  test("should return false for a null", () => {
    const result = isConnectError(null);

    expect(result).toBeFalsy();
  });
});

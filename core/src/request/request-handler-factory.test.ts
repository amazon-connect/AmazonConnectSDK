/* eslint-disable @typescript-eslint/unbound-method */
import { mocked } from "jest-mock";

import { ConnectError } from "../error";
import { RequestMessage, ResponseMessage } from "../messaging";
import { formatClientTimeoutError } from "./client-timeout-error";
import {
  createRequestHandler,
  ResponseHandler,
} from "./request-handler-factory";
import {
  ConnectResponseError,
  ConnectResponseSuccess,
} from "./request-handlers";

jest.mock("./client-timeout-error");
jest.mock("../error/connect-error");

const onStart: (handler: ResponseHandler) => void = jest.fn();
const onTimeout: (details: {
  timeoutMs: number;
  request: RequestMessage;
}) => void = jest.fn();

const requestMessage: RequestMessage = {
  type: "request",
  requestId: "abc-123",
} as RequestMessage;

type TestResponseData = { foo: number };

let requestPromise: Promise<TestResponseData>;
let responseHandler: ResponseHandler;

describe("when the request is successful", () => {
  const responseMessage: ResponseMessage & ConnectResponseSuccess = {
    type: "response",
    isError: false,
    requestId: "abc-123",
    namespace: "test-namespace",
    data: { foo: 1 },
  };
  let isPromiseComplete: boolean;

  beforeAll(() => {
    jest.resetAllMocks();
    isPromiseComplete = false;

    requestPromise = createRequestHandler<TestResponseData>(
      requestMessage,
      onStart,
      onTimeout,
    ).finally(() => (isPromiseComplete = true));
  });

  test("should invoke the onStart handler", () => {
    expect(onStart).toHaveBeenCalled();

    responseHandler = mocked(onStart).mock.calls[0][0];
    expect(responseHandler).toBeDefined();
  });

  test("should not complete the request promise prior to calling handler", async () => {
    await new Promise(process.nextTick);

    expect(isPromiseComplete).toBeFalsy();
  });

  test("should complete the request promise after invoking handler", async () => {
    responseHandler(responseMessage);
    await new Promise(process.nextTick);

    expect(isPromiseComplete).toBeTruthy();
  });

  test("should return the response data", async () => {
    const result = await requestPromise;
    expect(result).toEqual(responseMessage.data);
  });

  test("should not have called onTimeout", () => {
    expect(onTimeout).not.toHaveBeenCalled();
  });
});

describe("when the request errors", () => {
  const responseMessage: ResponseMessage & ConnectResponseError = {
    type: "response",
    isError: true,
    requestId: "abc-123",
    namespace: "test-namespace",
    errorKey: "test-error",
    reason: "testing the error",
    details: { command: "test", requestData: requestMessage.data },
  };

  let isPromiseComplete: boolean;

  beforeAll(() => {
    jest.resetAllMocks();

    requestPromise = createRequestHandler<TestResponseData>(
      requestMessage,
      onStart,
      onTimeout,
    ).finally(() => (isPromiseComplete = true));
  });

  test("should invoke the onStart handler", () => {
    expect(onStart).toHaveBeenCalled();

    responseHandler = mocked(onStart).mock.calls[0][0];
    expect(responseHandler).toBeDefined();
  });

  test("should not complete the request promise prior to calling handler", async () => {
    await new Promise(process.nextTick);

    expect(isPromiseComplete).toBeFalsy();
  });

  test("should complete the request promise after invoking handler", async () => {
    responseHandler(responseMessage);
    await new Promise(process.nextTick);

    expect(isPromiseComplete).toBeTruthy();
  });

  test("should reject with error information", async () => {
    try {
      await requestPromise;
    } catch (e) {
      expect(e).toBeInstanceOf(ConnectError);
      expect(ConnectError).toHaveBeenCalledWith(responseMessage);
    }
    expect.hasAssertions();
  });

  test("should not have called onTimeout", () => {
    expect(onTimeout).not.toHaveBeenCalled();
  });
});

describe("when the request times out", () => {
  const timeoutMs = 3;
  const expectedError = {
    errorKey: "clientTimeout",
    reason: "test",
  } as ReturnType<typeof formatClientTimeoutError>;

  beforeAll(() => {
    jest.resetAllMocks();

    mocked(formatClientTimeoutError).mockReturnValueOnce(expectedError);

    requestPromise = createRequestHandler<TestResponseData>(
      requestMessage,
      onStart,
      onTimeout,
      timeoutMs,
    );
  });

  test("should invoke the onStart handler", () => {
    expect(onStart).toHaveBeenCalled();

    responseHandler = mocked(onStart).mock.calls[0][0];
    expect(responseHandler).toBeDefined();
  });

  test("should not have invoked timeout prior to duration", () => {
    expect(onTimeout).not.toHaveBeenCalled();
  });

  test("should reject after timeout", async () => {
    await expect(requestPromise).rejects.toEqual(expectedError);
    expect(formatClientTimeoutError).toHaveBeenCalledWith(
      requestMessage,
      timeoutMs,
    );
  });

  test("should have called onTimeout", () => {
    expect(onTimeout).toHaveBeenCalledWith({
      timeoutMs,
      request: requestMessage,
    });
  });

  test("should return timeout error when response error comes after timeout", async () => {
    const responseMessage: ResponseMessage & ConnectResponseError = {
      type: "response",
      isError: true,
      requestId: "abc-123",
      namespace: "test-namespace",
      errorKey: "test-error",
      reason: "testing the error",
      details: { command: "test", requestData: requestMessage.data },
    };

    responseHandler(responseMessage);

    await expect(requestPromise).rejects.toEqual(expectedError);
    expect(ConnectError).not.toHaveBeenCalled();
  });
});

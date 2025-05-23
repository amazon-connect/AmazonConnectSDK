/* eslint-disable @typescript-eslint/unbound-method */
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectError } from "../../amazon-connect-error";
import { ConnectLogger, LogProvider } from "../../logging";
import { ErrorService } from "./error-service";

jest.mock("../../logging/connect-logger");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const logProvider = mock<LogProvider>();

beforeEach(() => jest.resetAllMocks());

describe("invoke", () => {
  let sut: ErrorService;
  let logger: MockedObject<ConnectLogger>;
  let testErr: AmazonConnectError;

  beforeEach(() => {
    sut = new ErrorService(logProvider);
    logger = LoggerMock.mock.instances[0];

    testErr = {
      message: "Test Error Message",
      key: "testError",
      isFatal: false,
      connectionStatus: "ready",
      details: { foo: 1 },
      proxyStatus: { initialized: true, startTime: new Date() },
    };
  });

  test("should log error when no handlers are attached", () => {
    sut.invoke(testErr);

    expect(logger.error).toHaveBeenCalledTimes(1);
    const [logMessage, logDetails, logOptions] = logger.error.mock.calls[0];
    expect(logMessage).toEqual(testErr.message);
    expect(logDetails?.key).toEqual(testErr.key);
    expect(logDetails?.isFatal).toEqual(testErr.isFatal);
    expect(logDetails?.connectionStatus).toEqual(testErr.connectionStatus);
    expect(logDetails?.details).toEqual(
      expect.objectContaining(testErr.details),
    );
    expect(logOptions?.duplicateMessageToConsole).toBeTruthy();
    expect(logOptions?.remoteIgnore).toBeTruthy();
  });

  test("should invoke two handlers on status change", () => {
    const mockHandler1 = jest.fn();
    const mockHandler2 = jest.fn();
    sut.onError(mockHandler1);
    sut.onError(mockHandler2);

    sut.invoke(testErr);

    expect(mockHandler1).toHaveBeenCalledWith(testErr);
    expect(mockHandler2).toHaveBeenCalledWith(testErr);
    expect(logger.error).toHaveBeenCalledTimes(1);
    const [logMessage, logDetails] = logger.error.mock.calls[0];
    expect(logMessage).toEqual(testErr.message);
    expect(logDetails?.key).toEqual(testErr.key);
  });

  test("should ignore handler that has been unsubscribed", () => {
    const mockHandler1 = jest.fn();
    const mockHandler2 = jest.fn();
    sut.onError(mockHandler1);
    sut.onError(mockHandler2);
    sut.offError(mockHandler2);

    sut.invoke(testErr);

    expect(mockHandler1).toHaveBeenCalledWith(testErr);
    expect(mockHandler2).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
    const [logMessage, logDetails] = logger.error.mock.calls[0];
    expect(logMessage).toEqual(testErr.message);
    expect(logDetails?.key).toEqual(testErr.key);
  });

  test("should catch and log handler error", () => {
    const mockHandler = jest.fn();
    const handlerError = "handlerError";
    mockHandler.mockImplementation(() => {
      throw new Error(handlerError);
    });
    sut.onError(mockHandler);

    sut.invoke(testErr);

    expect(logger.error).toHaveBeenCalledTimes(2);
    const [logMessage, logDetails, logOptions] = logger.error.mock.calls[0];
    expect(logMessage).toEqual(testErr.message);
    expect(logDetails?.key).toEqual(testErr.key);
    expect(logOptions?.duplicateMessageToConsole).toBeTruthy();
    expect(logOptions?.remoteIgnore).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_m, errorData, handlerErrorLogOptions] = logger.error.mock.calls[1];
    expect(errorData?.handlerError).toBeInstanceOf(Error);
    expect((errorData?.handlerError as { message: string }).message).toEqual(
      handlerError,
    );
    expect(errorData?.originalError).toEqual(expect.objectContaining(testErr));
    expect(handlerErrorLogOptions?.duplicateMessageToConsole).toBeUndefined();
    expect(handlerErrorLogOptions?.remoteIgnore).toBeUndefined();
  });
});

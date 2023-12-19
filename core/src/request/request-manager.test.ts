/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { mocked, MockedClass, MockedObject } from "jest-mock";

import { ConnectLogger } from "../logging";
import { RequestMessage, ResponseMessage } from "../messaging";
import {
  createRequestHandler,
  ResponseHandler,
} from "./request-handler-factory";
import { RequestManager } from "./request-manager";

jest.mock("../logging/connect-logger");
jest.mock("./request-handler-factory");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const requestId = "abc-123";
let sut: RequestManager;
let logger: MockedObject<ConnectLogger>;

describe("for a successful request and response flow", () => {
  let handler: ResponseHandler;

  beforeAll(() => {
    jest.resetAllMocks();
    sut = new RequestManager();
    handler = jest.fn();
    logger = LoggerMock.mock.instances[0];
  });

  beforeEach(() => {
    mocked(handler).mockReset();
    logger.error.mockReset();
  });

  test("should process the request", () => {
    const requestMsg = {
      type: "request",
      requestId,
    } as RequestMessage;
    const requestPromise = Promise.resolve();

    mocked(createRequestHandler).mockReturnValueOnce(requestPromise);

    const result = sut.processRequest(requestMsg);

    expect(result).toEqual(requestPromise);
    const [requestSentToHandler, onStart] =
      mocked(createRequestHandler).mock.calls[0];
    expect(requestSentToHandler).toEqual(requestMsg);
    expect(logger.error).not.toHaveBeenCalled();
    onStart(handler);
  });

  test("should invoke handler on response", () => {
    const responseMsg = {
      type: "response",
      requestId,
    } as ResponseMessage;

    sut.processResponse(responseMsg);

    expect(handler).toHaveBeenCalledWith(responseMsg);
    expect(logger.error).not.toHaveBeenCalled();
  });

  test("should not invoke handler again when a second response arrives", () => {
    const responseMsg = {
      type: "response",
      requestId,
    } as ResponseMessage;

    sut.processResponse(responseMsg);

    expect(handler).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    const logDetails = logger.error.mock.calls[0][1];
    expect(logDetails!.message).toEqual(responseMsg);
  });
});

describe("for a response with an unknown request id", () => {
  beforeAll(jest.resetAllMocks);

  test("should log an error", () => {
    const sut = new RequestManager();
    const logger = LoggerMock.mock.instances[0];
    const responseMsg = {
      type: "response",
      requestId,
    } as ResponseMessage;

    sut.processResponse(responseMsg);
    expect(logger.error).toHaveBeenCalled();
    const logDetails = logger.error.mock.calls[0][1];
    expect(logDetails!.message).toEqual(responseMsg);
  });
});

describe("when a request times out on the client", () => {
  let handler: ResponseHandler;
  let timeoutAction: (details: {
    timeoutMs: number;
    request: RequestMessage;
  }) => void;
  const requestMsg: RequestMessage = {
    type: "request",
    requestId,
    namespace: "test-namespace",
    command: "test-command",
  } as RequestMessage;

  beforeAll(() => {
    jest.resetAllMocks();
    sut = new RequestManager();
    handler = jest.fn();
    logger = LoggerMock.mock.instances[0];

    mocked(createRequestHandler).mockReturnValueOnce(Promise.resolve());

    void sut.processRequest(requestMsg);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_requestSentToHandler, onStart, onTimeout] =
      mocked(createRequestHandler).mock.calls[0];
    onStart(handler);
    timeoutAction = onTimeout;
  });

  beforeEach(() => {
    logger.error.mockReset();
  });

  test("should log the timeout", () => {
    const timeoutMs = 5000;

    timeoutAction({ request: requestMsg, timeoutMs });

    expect(logger).toEqual(LoggerMock.mock.instances[0]);

    expect(handler).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
    const logDetails = logger.error.mock.calls[0][1];
    expect(logDetails!.requestId).toEqual(requestId);
    expect(logDetails!.namespace).toEqual(requestMsg.namespace);
    expect(logDetails!.command).toEqual(requestMsg.command);
    expect(logDetails!.timeoutMs).toEqual(timeoutMs);
  });

  test("should not invoke handler after the timeout", () => {
    const responseMsg = {
      type: "response",
      requestId,
    } as ResponseMessage;

    sut.processResponse(responseMsg);

    expect(handler).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
    const logDetails = logger.error.mock.calls[0][1];
    expect(logDetails!.message).toEqual(responseMsg);
  });
});

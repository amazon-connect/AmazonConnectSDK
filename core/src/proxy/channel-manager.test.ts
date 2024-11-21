/* eslint-disable @typescript-eslint/unbound-method */
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ConnectLogger, LogProvider } from "../logging";
import {
  ChildConnectionCloseMessage,
  ChildConnectionEnabledDownstreamMessage,
  ChildConnectionEnabledUpstreamMessage,
  ChildDownstreamMessage,
  ChildUpstreamMessage,
  sanitizeDownstreamMessage,
} from "../messaging";
import { ChannelManager } from "./channel-manager";

beforeEach(jest.resetAllMocks);

jest.mock("../logging/connect-logger");
jest.mock("../messaging/downstream-message-sanitizer");

const testConnectionId = "connection-1";
const testProviderId = "provider-1";
const testSourceProviderId = "sourceProviderId";
const providerMock = mock<LogProvider>({ id: testSourceProviderId });
const mockMessagePort = mock<MessagePort>();
const relayChildUpstreamMessageMock = jest.fn<void, [ChildUpstreamMessage]>();
let sut: ChannelManager;
let loggerMock: MockedObject<ConnectLogger>;

beforeEach(() => {
  sut = new ChannelManager(providerMock, relayChildUpstreamMessageMock);
  loggerMock = mocked(ConnectLogger).mock.instances[0];
});

describe("addChannel", () => {
  test("should setup message port with started handler", () => {
    mockMessagePort.addEventListener.mockImplementationOnce(() => {
      expect(mockMessagePort.start).not.toBeCalled();
    });
    const testUpstreamMessage = mock<ChildConnectionEnabledUpstreamMessage>();

    sut.addChannel({
      connectionId: testConnectionId,
      port: mockMessagePort,
      providerId: testProviderId,
    });

    expect(mockMessagePort.addEventListener).toBeCalledWith(
      "message",
      expect.any(Function),
    );
    expect(mockMessagePort.start).toBeCalled();
    relayChildUpstreamMessageMock.mockReset();
    const messageHandler = mockMessagePort.addEventListener.mock
      .calls[0][1] as (message: MessageEvent<unknown>) => void;
    messageHandler({ data: testUpstreamMessage } as MessageEvent<unknown>);
    expect(relayChildUpstreamMessageMock).toBeCalledWith({
      type: "childUpstream",
      sourceProviderId: testProviderId,
      parentProviderId: testSourceProviderId,
      connectionId: testConnectionId,
      message: testUpstreamMessage,
    });
  });

  test("should set the connection on the map", () => {
    sut.addChannel({
      connectionId: testConnectionId,
      port: mockMessagePort,
      providerId: testProviderId,
    });

    const mapItem = sut["messagePorts"].get(testConnectionId)!;

    expect(mapItem).toBeDefined();
    expect(mapItem.port).toEqual(mockMessagePort);
    expect(mapItem.providerId).toEqual(testProviderId);
    expect(mapItem.handler).toEqual(
      mockMessagePort.addEventListener.mock.calls[0][1],
    );
  });

  test("should send connection ready message after message is setup", () => {
    mockMessagePort.addEventListener.mockImplementationOnce(() => {
      expect(relayChildUpstreamMessageMock).not.toBeCalled();
    });

    sut.addChannel({
      connectionId: testConnectionId,
      port: mockMessagePort,
      providerId: testProviderId,
    });

    expect(mockMessagePort.addEventListener).toBeCalled();
    expect(relayChildUpstreamMessageMock).toBeCalledWith({
      type: "childUpstream",
      sourceProviderId: testProviderId,
      parentProviderId: testSourceProviderId,
      connectionId: testConnectionId,
      message: {
        type: "childConnectionReady",
      },
    });
    expect(loggerMock.debug).toBeCalledWith(expect.any(String), {
      connectionId: testConnectionId,
    });
    expect(loggerMock.error).not.toBeCalled();
  });

  describe("when the port is already added", () => {
    beforeEach(() => {
      sut.addChannel({
        connectionId: testConnectionId,
        port: mockMessagePort,
        providerId: testProviderId,
      });
    });

    describe("when attempting to add a connection id that already exists", () => {
      beforeEach(() => {
        relayChildUpstreamMessageMock.mockReset();
        sut.addChannel({
          connectionId: testConnectionId,
          port: mock<MessagePort>(),
          providerId: "other-provider-id",
        });
      });

      test("should log error", () => {
        expect(loggerMock.error).toBeCalledWith(expect.any(String), {
          connectionId: testConnectionId,
        });
      });

      test("should not send child connection ready message", () => {
        expect(relayChildUpstreamMessageMock).not.toBeCalled();
      });

      test("should not change existing message port", () => {
        expect(sut["messagePorts"].get(testConnectionId)?.port).toEqual(
          mockMessagePort,
        );
        expect(sut["messagePorts"].get(testConnectionId)?.providerId).toEqual(
          testProviderId,
        );
      });
    });
  });
});

describe("handleDownstreamMessage", () => {
  describe("when the connectionId does not exist", () => {
    test("should warn and take no action", () => {
      const innerMessage = mock<ChildConnectionEnabledDownstreamMessage>();
      const message = {
        connectionId: testConnectionId,
        message: innerMessage,
        type: "childDownstreamMessage",
      } as ChildDownstreamMessage;

      const sanitizedMessage = { value: "sanitized" };
      mocked(sanitizeDownstreamMessage).mockReturnValueOnce(sanitizedMessage);

      sut.handleDownstreamMessage(message);

      expect(loggerMock.warn).toBeCalledWith(expect.any(String), {
        connectionId: testConnectionId,
        message: sanitizedMessage,
      });
      expect(loggerMock.error).not.toBeCalled();
      expect(sanitizeDownstreamMessage).toBeCalledWith(innerMessage);
      expect(mockMessagePort.postMessage).not.toBeCalled();
    });
  });

  describe("when the connectionId does exist", () => {
    describe("when the providerId is defined", () => {
      beforeEach(() => {
        sut.addChannel({
          connectionId: testConnectionId,
          port: mockMessagePort,
          providerId: testProviderId,
        });
      });

      describe("when the targetProviderId does not match providerId", () => {
        test("should error and not post", () => {
          const mismatchProviderId = "mismatch-id";
          const innerMessage = mock<ChildConnectionEnabledDownstreamMessage>();
          const message = {
            connectionId: testConnectionId,
            message: innerMessage,
            targetProviderId: mismatchProviderId,
            type: "childDownstreamMessage",
          } as ChildDownstreamMessage;

          const sanitizedMessage = { value: "sanitized" };
          mocked(sanitizeDownstreamMessage).mockReturnValueOnce(
            sanitizedMessage,
          );

          sut.handleDownstreamMessage(message);

          expect(loggerMock.warn).not.toBeCalled();
          expect(loggerMock.error).toBeCalledWith(expect.any(String), {
            connectionId: testConnectionId,
            message: sanitizedMessage,
            targetProviderId: mismatchProviderId,
            actualProviderId: testProviderId,
          });
          expect(sanitizeDownstreamMessage).toBeCalledWith(innerMessage);
          expect(mockMessagePort.postMessage).not.toBeCalled();
        });
      });

      describe("when the providerId is valid", () => {
        test("should post the message", () => {
          const innerMessage = mock<ChildConnectionEnabledDownstreamMessage>();
          const message = {
            connectionId: testConnectionId,
            message: innerMessage,
            targetProviderId: testProviderId,
            type: "childDownstreamMessage",
          } as ChildDownstreamMessage;

          sut.handleDownstreamMessage(message);

          expect(loggerMock.warn).not.toBeCalled();
          expect(loggerMock.error).not.toBeCalled();
          expect(sanitizeDownstreamMessage).not.toBeCalled();
          expect(mockMessagePort.postMessage).toBeCalledWith(innerMessage);
        });
      });
    });

    describe("when the providerId is not defined (older version of SDK)", () => {
      test("should post the message", () => {
        sut.addChannel({
          connectionId: testConnectionId,
          port: mockMessagePort,
          providerId: undefined as unknown as string,
        });
        const innerMessage = mock<ChildConnectionEnabledDownstreamMessage>();
        const message = {
          connectionId: testConnectionId,
          message: innerMessage,
          targetProviderId: testProviderId,
          type: "childDownstreamMessage",
        } as ChildDownstreamMessage;

        sut.handleDownstreamMessage(message);

        expect(loggerMock.warn).not.toBeCalled();
        expect(loggerMock.error).not.toBeCalled();
        expect(sanitizeDownstreamMessage).not.toBeCalled();
        expect(mockMessagePort.postMessage).toBeCalledWith(innerMessage);
      });
    });
  });
});

describe("handleCloseMessage", () => {
  beforeEach(() => {
    sut.addChannel({
      connectionId: testConnectionId,
      port: mockMessagePort,
      providerId: testProviderId,
    });
    loggerMock.debug.mockReset();
  });

  test("should warn and take no action when connectionId is not found", () => {
    const unknownConnectionId = "unknown-1";
    const closeMessage = mock<ChildConnectionCloseMessage>({
      connectionId: unknownConnectionId,
    });

    sut.handleCloseMessage(closeMessage);

    expect(loggerMock.warn).toBeCalledWith(expect.any(String), {
      connectionId: unknownConnectionId,
    });
    expect(sut["messagePorts"].size).toEqual(1);
    expect(loggerMock.debug).not.toBeCalled();
  });

  test("should message and close port", () => {
    const closeMessage = mock<ChildConnectionCloseMessage>({
      connectionId: testConnectionId,
    });
    mockMessagePort.removeEventListener.mockImplementation(() => {
      expect(mockMessagePort.close).not.toBeCalled();
    });
    const messageHandler = mockMessagePort.addEventListener.mock
      .calls[0][1] as (message: MessageEvent<unknown>) => void;

    sut.handleCloseMessage(closeMessage);

    expect(mockMessagePort.removeEventListener).toBeCalledWith(
      "message",
      messageHandler,
    );
    expect(mockMessagePort.close).toBeCalled();
    expect(sut["messagePorts"].size).toEqual(0);
    expect(loggerMock.warn).not.toBeCalled();
    expect(loggerMock.debug).toBeCalledWith(expect.any(String), {
      connectionId: testConnectionId,
    });
  });
});

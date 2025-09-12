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
  describe("iframe type", () => {
    test("should setup message port with started handler", () => {
      mockMessagePort.addEventListener.mockImplementationOnce(() => {
        expect(mockMessagePort.start).not.toBeCalled();
      });
      const testUpstreamMessage = mock<ChildConnectionEnabledUpstreamMessage>();

      sut.addChannel({
        type: "iframe",
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
        type: "iframe",
        connectionId: testConnectionId,
        port: mockMessagePort,
        providerId: testProviderId,
      });

      const mapItem = sut["channels"].get(testConnectionId)!;

      expect(mapItem).toBeDefined();
      expect(mapItem.type).toEqual("iframe");
      expect(mapItem.providerId).toEqual(testProviderId);
      if (mapItem.type === "iframe") {
        expect(mapItem.port).toEqual(mockMessagePort);
        expect(mapItem.handler).toEqual(
          mockMessagePort.addEventListener.mock.calls[0][1],
        );
      }
    });

    test("should send connection ready message after message is setup", () => {
      mockMessagePort.addEventListener.mockImplementationOnce(() => {
        expect(relayChildUpstreamMessageMock).not.toBeCalled();
      });

      sut.addChannel({
        type: "iframe",
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
        type: "iframe",
      });
      expect(loggerMock.error).not.toBeCalled();
    });
  });

  describe("component type", () => {
    const mockSendDownstreamMessage = jest.fn();
    const mockSetUpstreamMessageHandler = jest.fn();

    beforeEach(() => {
      mockSendDownstreamMessage.mockReset();
      mockSetUpstreamMessageHandler.mockReset();
    });

    test("should setup component channel with upstream handler", () => {
      const testUpstreamMessage = mock<ChildConnectionEnabledUpstreamMessage>();

      sut.addChannel({
        type: "component",
        connectionId: testConnectionId,
        providerId: testProviderId,
        sendDownstreamMessage: mockSendDownstreamMessage,
        setUpstreamMessageHandler: mockSetUpstreamMessageHandler,
      });

      expect(mockSetUpstreamMessageHandler).toBeCalledWith(
        expect.any(Function),
      );

      relayChildUpstreamMessageMock.mockReset();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const upstreamHandler =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockSetUpstreamMessageHandler.mock.calls[0]?.[0] as (
          message: ChildConnectionEnabledUpstreamMessage,
        ) => void;
      upstreamHandler(testUpstreamMessage);

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
        type: "component",
        connectionId: testConnectionId,
        providerId: testProviderId,
        sendDownstreamMessage: mockSendDownstreamMessage,
        setUpstreamMessageHandler: mockSetUpstreamMessageHandler,
      });

      const mapItem = sut["channels"].get(testConnectionId)!;

      expect(mapItem).toBeDefined();
      expect(mapItem.type).toEqual("component");
      expect(mapItem.providerId).toEqual(testProviderId);
      if (mapItem.type === "component") {
        expect(mapItem.sendDownstreamMessage).toEqual(
          mockSendDownstreamMessage,
        );
        expect(mapItem.setUpstreamMessageHandler).toEqual(
          mockSetUpstreamMessageHandler,
        );
      }
    });

    test("should send connection ready message after setup", () => {
      mockSetUpstreamMessageHandler.mockImplementationOnce(() => {
        expect(relayChildUpstreamMessageMock).not.toBeCalled();
      });

      sut.addChannel({
        type: "component",
        connectionId: testConnectionId,
        providerId: testProviderId,
        sendDownstreamMessage: mockSendDownstreamMessage,
        setUpstreamMessageHandler: mockSetUpstreamMessageHandler,
      });

      expect(mockSetUpstreamMessageHandler).toBeCalled();
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
        type: "component",
      });
      expect(loggerMock.error).not.toBeCalled();
    });
  });

  describe("when the port is already added", () => {
    beforeEach(() => {
      sut.addChannel({
        type: "iframe",
        connectionId: testConnectionId,
        port: mockMessagePort,
        providerId: testProviderId,
      });
    });

    describe("when attempting to add a connection id that already exists", () => {
      beforeEach(() => {
        relayChildUpstreamMessageMock.mockReset();
        sut.addChannel({
          type: "iframe",
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
        const channelData = sut["channels"].get(testConnectionId);
        expect(channelData).toBeDefined();
        if (channelData && channelData.type === "iframe") {
          expect(channelData.port).toEqual(mockMessagePort);
          expect(channelData.providerId).toEqual(testProviderId);
        }
      });
    });
  });
});

describe("updateChannelPort", () => {
  describe("when the original connection exists", () => {
    const originalMessagePort = mock<MessagePort>({ onmessage: jest.fn() });

    beforeEach(() => {
      sut.addChannel({
        type: "iframe",
        connectionId: testConnectionId,
        port: originalMessagePort,
        providerId: "original-provider-id",
      });
      relayChildUpstreamMessageMock.mockReset();
    });

    test("should close the original message port", () => {
      sut.updateChannelPort({
        connectionId: testConnectionId,
        port: mockMessagePort,
        providerId: testProviderId,
      });

      expect(originalMessagePort.onmessage).toBeNull();
      expect(originalMessagePort.close).toHaveBeenCalled();
    });

    test("should update message port with started handler", () => {
      mockMessagePort.addEventListener.mockImplementationOnce(() => {
        expect(mockMessagePort.start).not.toHaveBeenCalled();
      });
      const testUpstreamMessage = mock<ChildConnectionEnabledUpstreamMessage>();

      sut.updateChannelPort({
        connectionId: testConnectionId,
        port: mockMessagePort,
        providerId: testProviderId,
      });

      expect(mockMessagePort.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
      expect(mockMessagePort.start).toHaveBeenCalled();
      relayChildUpstreamMessageMock.mockReset();
      const messageHandler = mockMessagePort.addEventListener.mock
        .calls[0][1] as (message: MessageEvent<unknown>) => void;
      messageHandler({ data: testUpstreamMessage } as MessageEvent<unknown>);
      expect(relayChildUpstreamMessageMock).toHaveBeenCalledWith({
        type: "childUpstream",
        sourceProviderId: testProviderId,
        parentProviderId: testSourceProviderId,
        connectionId: testConnectionId,
        message: testUpstreamMessage,
      });
    });

    test("should set the connection on the map", () => {
      sut.updateChannelPort({
        connectionId: testConnectionId,
        port: mockMessagePort,
        providerId: testProviderId,
      });

      const mapItem = sut["channels"].get(testConnectionId)!;

      expect(mapItem).toBeDefined();
      expect(mapItem.type).toEqual("iframe");
      expect(mapItem.providerId).toEqual(testProviderId);
      if (mapItem.type === "iframe") {
        expect(mapItem.port).toEqual(mockMessagePort);
        expect(mapItem.handler).toEqual(
          mockMessagePort.addEventListener.mock.calls[0][1],
        );
      }
    });

    test("should send connection ready message after message is setup", () => {
      mockMessagePort.addEventListener.mockImplementationOnce(() => {
        expect(relayChildUpstreamMessageMock).not.toHaveBeenCalled();
      });

      sut.updateChannelPort({
        connectionId: testConnectionId,
        port: mockMessagePort,
        providerId: testProviderId,
      });

      expect(mockMessagePort.addEventListener).toHaveBeenCalled();
      expect(relayChildUpstreamMessageMock).toHaveBeenCalledWith({
        type: "childUpstream",
        sourceProviderId: testProviderId,
        parentProviderId: testSourceProviderId,
        connectionId: testConnectionId,
        message: {
          type: "childConnectionReady",
        },
      });
      expect(loggerMock.debug).toHaveBeenCalledWith(expect.any(String), {
        connectionId: testConnectionId,
        type: "iframe",
      });

      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when attempting to update a component channel connection", () => {
    const mockSendDownstreamMessage = jest.fn();
    const mockSetUpstreamMessageHandler = jest.fn();

    beforeEach(() => {
      sut.addChannel({
        type: "component",
        connectionId: testConnectionId,
        providerId: "original-provider-id",
        sendDownstreamMessage: mockSendDownstreamMessage,
        setUpstreamMessageHandler: mockSetUpstreamMessageHandler,
      });
      relayChildUpstreamMessageMock.mockReset();
    });

    test("should log error and not update", () => {
      sut.updateChannelPort({
        connectionId: testConnectionId,
        port: mockMessagePort,
        providerId: testProviderId,
      });

      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        connectionId: testConnectionId,
      });
      expect(relayChildUpstreamMessageMock).not.toHaveBeenCalled();
    });
  });

  describe("when attempting to update the port for a non existing connection", () => {
    const newMessagePort = mock<MessagePort>();
    beforeEach(() => {
      relayChildUpstreamMessageMock.mockReset();
      sut.updateChannelPort({
        connectionId: testConnectionId,
        port: newMessagePort,
        providerId: "updated-provider-id",
      });
    });

    test("should log error", () => {
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        connectionId: testConnectionId,
      });
    });

    test("should not start message port", () => {
      expect(newMessagePort.close).not.toHaveBeenCalled();
    });

    test("should not send child connection ready message", () => {
      expect(relayChildUpstreamMessageMock).not.toHaveBeenCalled();
    });

    test("should not set message port", () => {
      expect(sut["channels"].get(testConnectionId)).toBeUndefined();
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
    describe("iframe channel", () => {
      beforeEach(() => {
        sut.addChannel({
          type: "iframe",
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

      describe("when the providerId is not defined (older version of SDK)", () => {
        test("should post the message", () => {
          sut.addChannel({
            type: "iframe",
            connectionId: "test-2",
            port: mockMessagePort,
            providerId: undefined as unknown as string,
          });
          const innerMessage = mock<ChildConnectionEnabledDownstreamMessage>();
          const message = {
            connectionId: "test-2",
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

    describe("component channel", () => {
      const mockSendDownstreamMessage = jest.fn();
      const mockSetUpstreamMessageHandler = jest.fn();

      beforeEach(() => {
        mockSendDownstreamMessage.mockReset();
        sut.addChannel({
          type: "component",
          connectionId: testConnectionId,
          providerId: testProviderId,
          sendDownstreamMessage: mockSendDownstreamMessage,
          setUpstreamMessageHandler: mockSetUpstreamMessageHandler,
        });
      });

      test("should send message via component function", () => {
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
        expect(mockSendDownstreamMessage).toBeCalledWith(innerMessage);
        expect(mockMessagePort.postMessage).not.toBeCalled();
      });
    });
  });
});

describe("handleCloseMessage", () => {
  describe("iframe channel", () => {
    beforeEach(() => {
      sut.addChannel({
        type: "iframe",
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
      expect(sut["channels"].size).toEqual(1);
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
      expect(sut["channels"].size).toEqual(0);
      expect(loggerMock.warn).not.toBeCalled();
      expect(loggerMock.debug).toBeCalledWith(expect.any(String), {
        connectionId: testConnectionId,
        type: "iframe",
      });
    });
  });

  describe("component channel", () => {
    const mockSendDownstreamMessage = jest.fn();
    const mockSetUpstreamMessageHandler = jest.fn();

    beforeEach(() => {
      sut.addChannel({
        type: "component",
        connectionId: testConnectionId,
        providerId: testProviderId,
        sendDownstreamMessage: mockSendDownstreamMessage,
        setUpstreamMessageHandler: mockSetUpstreamMessageHandler,
      });
      loggerMock.debug.mockReset();
    });

    test("should remove channel without port cleanup", () => {
      const closeMessage = mock<ChildConnectionCloseMessage>({
        connectionId: testConnectionId,
      });

      sut.handleCloseMessage(closeMessage);

      expect(sut["channels"].size).toEqual(0);
      expect(loggerMock.warn).not.toBeCalled();
      expect(loggerMock.debug).toBeCalledWith(expect.any(String), {
        connectionId: testConnectionId,
        type: "component",
      });
    });
  });
});

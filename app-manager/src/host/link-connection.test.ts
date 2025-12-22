import {
  AmazonConnectProvider,
  ConnectLogger,
  LogLevel,
  Proxy,
} from "@amazon-connect/core";
import { AppHostInitMessage } from "@amazon-connect/workspace-types";
import { mocked, MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { linkConnection } from "./link-connection";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const proxyMock = mock<Proxy>();
const providerMock = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});

beforeEach(jest.resetAllMocks);

describe("linkConnection", () => {
  describe("when setting initial connection", () => {
    test("should link connection", () => {
      const connectionId = "connection-id";
      const port = mock<MessagePort>();
      const hostInitMessage: AppHostInitMessage = {
        type: "connect-app-host-init",
        providerId: "provider-id",
        sdkVersion: "1.0.0",
      };

      linkConnection({
        instanceId: "instance-id",
        connectionId,
        provider: providerMock,
        port,
        hostInitMessage,
        isRestart: false,
      });

      expect(proxyMock.addChildChannel).toHaveBeenCalledWith({
        connectionId,
        port,
        providerId: hostInitMessage.providerId,
      });
      expect(proxyMock.updateChildChannelPort).not.toHaveBeenCalled();
      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).toHaveBeenCalledWith(expect.any(String), {
        appSdkVersion: hostInitMessage.sdkVersion,
      });
    });

    test("should log when addChildConnection throws an error", () => {
      const connectionId = "connection-id";
      const port = mock<MessagePort>();
      const hostInitMessage: AppHostInitMessage = {
        type: "connect-app-host-init",
        providerId: "provider-id",
        sdkVersion: "1.0.0",
      };
      const error = new Error("error");

      mocked(proxyMock.addChildChannel).mockImplementationOnce(() => {
        throw error;
      });

      linkConnection({
        instanceId: "instance-id",
        connectionId,
        provider: providerMock,
        port,
        hostInitMessage,
        isRestart: false,
      });

      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        error,
        isRestart: false,
      });
    });
  });

  describe("when restating connection", () => {
    test("should update port for connection", () => {
      const connectionId = "connection-id";
      const port = mock<MessagePort>();
      const hostInitMessage: AppHostInitMessage = {
        type: "connect-app-host-init",
        providerId: "provider-id",
        sdkVersion: "1.0.0",
      };

      linkConnection({
        instanceId: "instance-id",
        connectionId,
        provider: providerMock,
        port,
        hostInitMessage,
        isRestart: true,
      });

      expect(proxyMock.updateChildChannelPort).toHaveBeenCalledWith({
        connectionId,
        port,
        providerId: hostInitMessage.providerId,
      });
      expect(proxyMock.addChildChannel).not.toHaveBeenCalled();
      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).toHaveBeenCalledWith(expect.any(String), {
        appSdkVersion: hostInitMessage.sdkVersion,
      });
    });

    test("should log when updateChildChannelPort throws an error", () => {
      const connectionId = "connection-id";
      const port = mock<MessagePort>();
      const hostInitMessage: AppHostInitMessage = {
        type: "connect-app-host-init",
        providerId: "provider-id",
        sdkVersion: "1.0.0",
      };
      const error = new Error("error");

      mocked(proxyMock.updateChildChannelPort).mockImplementationOnce(() => {
        throw error;
      });

      linkConnection({
        instanceId: "instance-id",
        connectionId,
        provider: providerMock,
        port,
        hostInitMessage,
        isRestart: true,
      });

      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        error,
        isRestart: true,
      });
    });
  });

  test("should apply logger mixin", () => {
    const connectionId = "connection-id";
    const instanceId = "instance-id";
    const port = mock<MessagePort>();
    const hostInitMessage: AppHostInitMessage = {
      type: "connect-app-host-init",
      providerId: "provider-id",
      sdkVersion: "1.0.0",
    };

    linkConnection({
      instanceId,
      connectionId,
      provider: providerMock,
      port,
      hostInitMessage,
      isRestart: false,
    });

    expect(LoggerMock).toHaveBeenCalledTimes(1);
    const loggerConfig = LoggerMock.mock.calls[0][0];
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);
    expect(result.connectionId).toEqual(connectionId);
    expect(result.providerId).toEqual(hostInitMessage.providerId);
    expect(result.instanceId).toEqual(instanceId);
  });
});

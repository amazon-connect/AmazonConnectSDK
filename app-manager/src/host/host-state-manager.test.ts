import {
  AmazonConnectProvider,
  ConnectClientConfig,
  ConnectLogger,
  LogLevel,
} from "@amazon-connect/core";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ComponentState, CurrentState } from "../component-state";
import { StateChangeResult } from "../types";
import { HostStateManager } from "./host-state-manager";
import { HostStateManagerClient } from "./host-state-manager-client";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("../app-manager-client");

const providerMock = mock<AmazonConnectProvider>();
const mockHostStateManagerClientClass = jest.fn<
  HostStateManagerClient,
  [ConnectClientConfig | undefined]
>();
const workspaceClientMock = mock<HostStateManagerClient>();

const testInstanceId = "testInstanceId";
const testConnectionId = "connectionId";
const config = { name: "testName", arn: "testArn" };

let sut: HostStateManager;
let loggerMock: MockedObject<ConnectLogger>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  mockHostStateManagerClientClass.mockImplementationOnce(
    () => workspaceClientMock,
  );

  sut = new HostStateManager({
    provider: providerMock,
    instanceId: testInstanceId,
    connectionId: testConnectionId,
    config,
    hostStateManagerClient: mockHostStateManagerClientClass,
  });

  loggerMock = mocked(ConnectLogger).mock.instances[0];
});

describe("constructor", () => {
  test("should create HostStateManagerClient with provider", () => {
    expect(mockHostStateManagerClientClass).toHaveBeenCalledTimes(1);
    expect(mockHostStateManagerClientClass).toHaveBeenCalledWith({
      provider: providerMock,
    });
  });

  test("should configure logger mixin to include app info", () => {
    const loggerConfig = mocked(ConnectLogger).mock.calls[0][0];
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.instanceId).toEqual(testInstanceId);
    expect(result.appName).toEqual(config.name);
    expect(result.arn).toEqual(config.arn);
    expect(result.connectionId).toEqual(testConnectionId);
  });
});

describe("getState", () => {
  test("should return current app state", async () => {
    const currentState = mock<CurrentState>();
    workspaceClientMock.getState.mockResolvedValueOnce(currentState);

    const result = await sut.getState();

    expect(result).toEqual(currentState);
    expect(workspaceClientMock.getState).toHaveBeenCalledWith(testInstanceId);
  });

  test("should log error before throwing", async () => {
    const error = new Error("test error");
    workspaceClientMock.getState.mockRejectedValueOnce(error);

    try {
      await sut.getState();
    } catch (error) {
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        error,
      });
      expect(workspaceClientMock.getState).toHaveBeenCalledWith(testInstanceId);
    }

    expect.hasAssertions();
  });
});

describe("updateState", () => {
  const newState: ComponentState = "connected";

  describe("when the update succeeds", () => {
    test("should return the success result and log", async () => {
      const changeResult: StateChangeResult = {
        success: true,
        state: newState,
        previous: { state: "loading" },
        version: 2,
      };
      workspaceClientMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut["updateState"](newState);

      expect(result).toEqual(changeResult);
      expect(workspaceClientMock.updateState).toHaveBeenCalledWith(
        testInstanceId,
        newState,
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.any(String),
        changeResult,
      );
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    test("should omit log when omitLogMessages true", async () => {
      const changeResult: StateChangeResult = {
        success: true,
        state: newState,
        previous: { state: "loading" },
        version: 2,
      };
      workspaceClientMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut["updateState"](newState, true);

      expect(result).toEqual(changeResult);
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the update throws an error", () => {
    test("should log error before throwing", async () => {
      const testError = new Error("test error");
      workspaceClientMock.updateState.mockRejectedValueOnce(testError);

      try {
        await sut["updateState"](newState);
      } catch (error) {
        expect(error).toEqual(testError);
        expect(workspaceClientMock.updateState).toHaveBeenCalledWith(
          testInstanceId,
          newState,
        );
        expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
          error: testError,
          attemptedState: newState,
        });
        expect(loggerMock.info).not.toHaveBeenCalled();
        expect(loggerMock.warn).not.toHaveBeenCalled();
      }

      expect.hasAssertions();
    });

    test("should not log when omitLogMessages true", async () => {
      const testError = new Error("test error");
      workspaceClientMock.updateState.mockRejectedValueOnce(testError);

      try {
        await sut["updateState"](newState, true);
      } catch (error) {
        expect(error).toEqual(testError);
        expect(workspaceClientMock.updateState).toHaveBeenCalledWith(
          testInstanceId,
          newState,
        );
        expect(loggerMock.error).not.toHaveBeenCalled();
        expect(loggerMock.info).not.toHaveBeenCalled();
        expect(loggerMock.warn).not.toHaveBeenCalled();
      }

      expect.hasAssertions();
    });
  });

  describe("when the update failed because it is the current state", () => {
    test("should return the fail result without logging", async () => {
      const changeResult: StateChangeResult = {
        success: false,
        reason: "isCurrentState",
        state: newState,
      };
      workspaceClientMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut["updateState"](newState);

      expect(result).toEqual(changeResult);
      expect(workspaceClientMock.updateState).toHaveBeenCalledWith(
        testInstanceId,
        newState,
      );
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the update failed because the request is stale", () => {
    test("should return fail result without logging", async () => {
      const changeResult: StateChangeResult = {
        success: false,
        reason: "staleRequest",
        state: newState,
      };
      workspaceClientMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut["updateState"](newState);

      expect(result).toEqual(changeResult);
      expect(workspaceClientMock.updateState).toHaveBeenCalledWith(
        testInstanceId,
        newState,
      );
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the update failed because an invalid transition", () => {
    test("should return fail result with warning", async () => {
      const changeResult: StateChangeResult = {
        success: false,
        reason: "invalidTransition",
        state: "restarting",
      };
      workspaceClientMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut["updateState"](newState);

      expect(result).toEqual(changeResult);
      expect(workspaceClientMock.updateState).toHaveBeenCalledWith(
        testInstanceId,
        newState,
      );
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String), {
        ...changeResult,
        attemptedState: newState,
      });
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    test("should omit warning when omitLogMessages true", async () => {
      const changeResult: StateChangeResult = {
        success: false,
        reason: "invalidTransition",
        state: "restarting",
      };
      workspaceClientMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut["updateState"](newState, true);

      expect(result).toEqual(changeResult);

      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });
});

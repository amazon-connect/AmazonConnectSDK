import {
  AmazonConnectProvider,
  ConnectLogger,
  isNoResultResponseError,
  LogLevel,
} from "@amazon-connect/core";
import {
  AppConfig,
  AppManagerData,
  AppParameters,
  AppScope,
  IFrameAppConfig,
  LaunchSource,
} from "@amazon-connect/workspace-types";
import { mocked, MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppManagerClient } from "../../app-manager-client";
import { CurrentState } from "../../component-state";
import { HostStateManager } from "../../host";
import { StateChangeResult } from "../../types";
import {
  AppDestroyedHandler,
  AppDestroyingHandler,
  AppErrorHandler,
  AppInstanceStateChanged,
  AppInstanceStateChangedHandler,
  AppProvisionedHandler,
  AppRestartingHandler,
  AppRunningHandler,
  AppStateChangedHandler,
  AppStoppedHandler,
} from "../app-event-types";
import { AppFocusRelay } from "./app-focus-relay";
import { AppHost } from "./app-host";
import { AppHostEventRelay, AppStateChangeRelay } from "./app-host-event-relay";
import { AppHostParams } from "./app-host-params";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/request/no-result-error");
jest.mock("./app-host-event-relay");
jest.mock("../../host/host-state-manager");
jest.mock("../../app-manager-client");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const provider = mock<AmazonConnectProvider>();

class TestAppHost extends AppHost {}

const arn = "app-arn";
const appName = "app-name";
const appInstanceId = "app-instance-id";
const appConfig = mock<AppConfig>({
  arn,
  name: appName,
});
const connectionId = "connection-id";
const scope = mock<AppScope>();
const scopeKey = "scope-key";
const appCreateOrder = 2;
const appParameters = mock<AppParameters>();
const launchKey = "test-launch-key";
const launchByName = "launch-by-name";
const launchedBy = mock<LaunchSource>({ name: launchByName });
const appManagerData = mock<AppManagerData>();
const preventUserClose = true;

let sut: AppHost;
let loggerMock: MockedObject<ConnectLogger>;
let relayMock: MockedObject<AppHostEventRelay>;
let appManagerClientMock: MockedObject<AppManagerClient>;
let hostStateManagerMock: MockedObject<HostStateManager>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  const params = mock<AppHostParams>({
    provider,
    appInstanceId,
    instanceId: appInstanceId,
    connectionId,
    appConfig,
    config: appConfig,
    scope,
    scopeKey,
    appCreateOrder,
    parameters: appParameters,
    launchKey,
    preventUserClose,
    launchedBy,
    appManagerData,
  });

  mocked(AppHostEventRelay).mockImplementation(
    () =>
      ({
        stateChanged: mock<AppStateChangeRelay<AppStateChangedHandler>>(),
        provisioned: mock<AppStateChangeRelay<AppProvisionedHandler>>(),
        running: mock<AppStateChangeRelay<AppRunningHandler>>(),
        stopped: mock<AppStateChangeRelay<AppStoppedHandler>>(),
        restarting: mock<AppStateChangeRelay<AppRestartingHandler>>(),
        destroying: mock<AppStateChangeRelay<AppDestroyingHandler>>(),
        destroyed: mock<AppStateChangeRelay<AppDestroyedHandler>>(),
        error: mock<AppStateChangeRelay<AppErrorHandler>>(),
        focused: mock<AppFocusRelay>(),
        delayedDestroy: jest.fn(),
        immediateDestroy: jest.fn(),
      }) as unknown as MockedObject<AppHostEventRelay>,
  );

  sut = new TestAppHost(params);

  loggerMock = LoggerMock.mock.instances[0];
  relayMock = mocked(AppHostEventRelay).mock.results[0]
    .value as MockedObject<AppHostEventRelay>;
  appManagerClientMock = mocked(AppManagerClient).mock.instances[0];
  hostStateManagerMock = mocked(HostStateManager).mock.instances[0];
});

describe("constructor", () => {
  // This block can be removed after Workspace module is updated
  describe("when consumer is called from a Workspace module not sending launchedBy", () => {
    test("should set launchBy from launchSource", () => {
      const params = mock<AppHostParams>({
        launchSource: launchByName,
        launchedBy: undefined,
      });

      const sut = new TestAppHost(params);

      expect(sut.launchedBy).toEqual({ type: "unknown", name: launchByName });
      expect(sut.launchSource).toEqual(launchByName);
    });
  });

  test("should set the readonly public values", () => {
    expect(sut.instanceId).toEqual(appInstanceId);
    expect(sut.config).toEqual(appConfig);
    expect(sut.connectionId).toEqual(connectionId);
    expect(sut.scope).toEqual(scope);
    expect(sut.scopeKey).toEqual(scopeKey);
    expect(sut.appCreateOrder).toEqual(appCreateOrder);
    expect(sut.parameters).toEqual(appParameters);
    expect(sut.launchKey).toEqual(launchKey);
    expect(sut.launchedBy).toEqual(launchedBy);
    expect(sut.launchSource).toEqual(launchByName);
    expect(sut.appManagerData).toEqual(appManagerData);
    expect(sut.preventUserClose).toEqual(preventUserClose);
  });

  test("should set the instanceId values via depreciated appInstanceId", () => {
    const testInstanceId = "test-id";

    const sut = new TestAppHost(
      mock<AppHostParams>({
        appInstanceId: testInstanceId,
        instanceId: undefined,
      }),
    );

    expect(sut.instanceId).toEqual(testInstanceId);
    expect(sut.appInstanceId).toEqual(testInstanceId);
  });

  test("should set the config values via depreciated appConfig", () => {
    const testConfig = mock<IFrameAppConfig>();

    const sut = new TestAppHost(
      mock<AppHostParams>({
        appConfig: testConfig,
        config: undefined,
      }),
    );

    expect(sut.config).toEqual(testConfig);
    expect(sut.appConfig).toEqual(testConfig);
  });

  test("should create AppManagerClient with provider", () => {
    expect(AppManagerClient).toHaveBeenCalledTimes(1);
    expect(AppManagerClient).toHaveBeenCalledWith({ provider });
  });

  test("should create AppHostEventRelay with provider", () => {
    expect(AppHostEventRelay).toHaveBeenCalledTimes(1);
    expect(AppHostEventRelay).toHaveBeenCalledWith(provider, sut);
  });

  test("should configure logger mixin to include app info", () => {
    const loggerConfig = LoggerMock.mock.calls[0][0];
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.instanceId).toEqual(appInstanceId);
    expect(result.appName).toEqual(appName);
    expect(result.arn).toEqual(arn);
    expect(result.connectionId).toEqual(connectionId);
  });

  test("should setup destroyed handler with appInstanceId", () => {
    expect(appManagerClientMock.onDestroyed).toHaveBeenCalledTimes(1);
    expect(appManagerClientMock.onDestroyed).toHaveBeenCalledWith(
      expect.any(Function),
      appInstanceId,
    );
  });
});

describe("getState", () => {
  test("should return current app state", async () => {
    const currentState = mock<CurrentState>();
    hostStateManagerMock.getState.mockResolvedValueOnce(currentState);

    const result = await sut.getState();

    expect(result).toEqual(currentState);
  });
});

describe("start", () => {
  describe("when the app can be successfully started", () => {
    test("should return the success result", async () => {
      const changeResult: StateChangeResult = {
        success: true,
        state: "running",
        previous: { state: "stopped" },
        version: 2,
      };
      hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut.start();

      expect(result).toEqual({
        success: true,
        state: "running",
      });
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the app is already started", () => {
    test("should return the success result", async () => {
      const changeResult: StateChangeResult = {
        success: false,
        reason: "isCurrentState",
        state: "running",
      };
      hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut.start();

      expect(result).toEqual({
        success: true,
        state: "running",
      });
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the app does not exist", () => {
    test("should return appNotFound", async () => {
      const notFoundError = { notFound: true };
      hostStateManagerMock.updateState.mockRejectedValueOnce(notFoundError);
      mocked(isNoResultResponseError).mockReturnValueOnce(true);

      const result = await sut.start();

      expect(result).toEqual({
        success: false,
        reason: "appNotFound",
      });
      expect(isNoResultResponseError).toHaveBeenCalledWith(notFoundError);
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String));
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when attempting to start the app throws an unknown error", () => {
    test("should log the error before throwing", async () => {
      const testError = new Error("test error");
      hostStateManagerMock.updateState.mockRejectedValueOnce(testError);
      mocked(isNoResultResponseError).mockReturnValueOnce(false);

      try {
        await sut.start();
      } catch (error) {
        expect(error).toEqual(testError);
        expect(isNoResultResponseError).toHaveBeenCalledWith(testError);
        expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
          error: testError,
        });
      }

      expect.hasAssertions();
    });
  });

  describe("when the app fails to start", () => {
    test("should return the not successful result", async () => {
      const changeResult: StateChangeResult = {
        success: false,
        reason: "invalidTransition",
        state: "destroying",
      };
      hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut.start();

      expect(result).toEqual({
        success: false,
        reason: "invalidTransition",
      });
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        ...changeResult,
      });
    });
  });
});

describe("stop", () => {
  describe("when the app can be successfully stopped", () => {
    test("should return the success result", async () => {
      const changeResult: StateChangeResult = {
        success: true,
        state: "stopped",
        previous: { state: "running" },
        version: 2,
      };
      hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut.stop();

      expect(result).toEqual({
        success: true,
        state: "stopped",
      });
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the app is already stopped", () => {
    test("should return the success result", async () => {
      const changeResult: StateChangeResult = {
        success: false,
        reason: "isCurrentState",
        state: "stopped",
      };
      hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

      const result = await sut.stop();

      expect(result).toEqual({
        success: true,
        state: "stopped",
      });
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the app is not found", () => {
    test("should return appNotFound", async () => {
      const notFoundError = { notFound: true };
      hostStateManagerMock.updateState.mockRejectedValueOnce(notFoundError);
      mocked(isNoResultResponseError).mockReturnValueOnce(true);

      const result = await sut.stop();

      expect(result).toEqual({
        success: false,
        reason: "appNotFound",
      });
      expect(isNoResultResponseError).toHaveBeenCalledWith(notFoundError);
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String));
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when attempting to stop throws an unexpected error", () => {
    test("should log the error before throwing", async () => {
      const testError = new Error("test error");
      hostStateManagerMock.updateState.mockRejectedValueOnce(testError);
      mocked(isNoResultResponseError).mockReturnValueOnce(false);

      try {
        await sut.stop();
      } catch (error) {
        expect(error).toEqual(testError);
        expect(isNoResultResponseError).toHaveBeenCalledWith(testError);
        expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
          error: testError,
        });
      }

      expect.hasAssertions();
    });
  });

  describe("when the app fails to stop", () => {
    describe("when the current state is destroying", () => {
      test("should return the not successful result but not log error", async () => {
        const changeResult: StateChangeResult = {
          success: false,
          reason: "invalidTransition",
          state: "destroying",
        };
        hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

        const result = await sut.stop();

        expect(result).toEqual({
          success: false,
          reason: "invalidTransition",
        });
        expect(loggerMock.debug).toHaveBeenCalledWith(expect.any(String), {
          ...changeResult,
        });
        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });

    describe("when the current state is destroyed", () => {
      test("should return the not successful result but not log error", async () => {
        const changeResult: StateChangeResult = {
          success: false,
          reason: "invalidTransition",
          state: "destroyed",
        };
        hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

        const result = await sut.stop();

        expect(result).toEqual({
          success: false,
          reason: "invalidTransition",
        });
        expect(loggerMock.debug).toHaveBeenCalledWith(expect.any(String), {
          ...changeResult,
        });
        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });

    describe("when the current state is not destroying or destroyed", () => {
      test("should return the not successful result", async () => {
        const changeResult: StateChangeResult = {
          success: false,
          reason: "invalidTransition",
          state: "loading",
        };
        hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

        const result = await sut.stop();

        expect(result).toEqual({
          success: false,
          reason: "invalidTransition",
        });
        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
          ...changeResult,
        });
      });
    });
  });
});

describe("destroy", () => {
  describe("when not waiting for completion", () => {
    describe("when the app has updated to destroying", () => {
      test("should return destroyStarted true", async () => {
        const changeResult: StateChangeResult = {
          success: true,
          state: "destroying",
          previous: { state: "running" },
          version: 2,
        };
        hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

        const result = await sut.destroy({
          waitForCompletion: false,
        });

        expect(result.destroyStarted).toBeTruthy();
        expect(result.destroyCompleted).toBeFalsy();
        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });

    describe("when the app is already destroying", () => {
      test("should return destroyStarted true", async () => {
        const changeResult: StateChangeResult = {
          success: false,
          reason: "isCurrentState",
          state: "destroying",
        };
        hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

        const result = await sut.destroy();

        expect(result.destroyStarted).toBeTruthy();
        expect(result.destroyCompleted).toBeFalsy();
        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });

    describe("when the app is not destroying", () => {
      test("should return destroyStarted false", async () => {
        const changeResult: StateChangeResult = {
          success: false,
          reason: "invalidTransition",
          state: "stopped",
        };
        hostStateManagerMock.updateState.mockResolvedValueOnce(changeResult);

        const result = await sut.destroy();

        expect(result.destroyStarted).toBeFalsy();
        expect(result.destroyCompleted).toBeFalsy();
      });
    });
  });

  describe("when not waiting for completion", () => {
    test("should call the wait for destroy flow", async () => {
      const result = await sut.destroy({ waitForCompletion: true });

      expect(result.destroyStarted).toBeTruthy();
      expect(result.destroyCompleted).toBeTruthy();
      expect(appManagerClientMock.destroyInstance).toHaveBeenCalledWith(
        appInstanceId,
      );
      expect(hostStateManagerMock.updateState).not.toHaveBeenCalled();
    });
  });
});

describe("onStateChanged", () => {
  test("should add state changed handler", () => {
    const handler = jest.fn();

    sut.onStateChanged(handler);

    expect(relayMock.stateChanged.on).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("offStateChanged", () => {
  test("should remove state changed handler", () => {
    const handler = jest.fn();

    sut.offStateChanged(handler);

    expect(relayMock.stateChanged.off).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("onProvisioned", () => {
  test("should add provisioned handler", () => {
    const handler = jest.fn();

    sut.onProvisioned(handler);

    expect(relayMock.provisioned.on).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("offProvisioned", () => {
  test("should remove provisioned handler", () => {
    const handler = jest.fn();

    sut.offProvisioned(handler);

    expect(relayMock.provisioned.off).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("onRunning", () => {
  test("should add running handler", () => {
    const handler = jest.fn();

    sut.onRunning(handler);

    expect(relayMock.running.on).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("offRunning", () => {
  test("should remove running handler", () => {
    const handler = jest.fn();

    sut.offRunning(handler);

    expect(relayMock.running.off).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("onStopped", () => {
  test("should add stopped handler", () => {
    const handler = jest.fn();

    sut.onStopped(handler);

    expect(relayMock.stopped.on).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("offStopped", () => {
  test("should remove stopped handler", () => {
    const handler = jest.fn();

    sut.offStopped(handler);

    expect(relayMock.stopped.off).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("onRestarting", () => {
  test("should add restarting handler", () => {
    const handler = jest.fn();

    sut.onRestarting(handler);

    expect(relayMock.restarting.on).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("offRestarting", () => {
  test("should remove restating handler", () => {
    const handler = jest.fn();

    sut.offRestarting(handler);

    expect(relayMock.restarting.off).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("onDestroying", () => {
  test("should add destroying handler", () => {
    const handler = jest.fn();

    sut.onDestroying(handler);

    expect(relayMock.destroying.on).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("offDestroying", () => {
  test("should remove destroying handler", () => {
    const handler = jest.fn();

    sut.offDestroying(handler);

    expect(relayMock.destroying.off).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("onDestroyed", () => {
  test("should add destroyed handler", () => {
    const handler = jest.fn();

    sut.onDestroyed(handler);

    expect(relayMock.destroyed.on).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("offDestroyed", () => {
  test("should remove destroyed handler", () => {
    const handler = jest.fn();

    sut.offDestroyed(handler);

    expect(relayMock.destroyed.off).toHaveBeenCalledWith(
      handler,
      appInstanceId,
    );
  });
});

describe("onError", () => {
  test("should add error handler", () => {
    const handler = jest.fn();

    sut.onError(handler);

    expect(relayMock.error.on).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("offError", () => {
  test("should remove error handler", () => {
    const handler = jest.fn();

    sut.offError(handler);

    expect(relayMock.error.off).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("onFocus", () => {
  test("should remove error handler", () => {
    const handler = jest.fn();

    sut.onFocus(handler);

    expect(relayMock.focused.on).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("offFocus", () => {
  test("should remove error handler", () => {
    const handler = jest.fn();

    sut.offFocus(handler);

    expect(relayMock.focused.off).toHaveBeenCalledWith(handler, appInstanceId);
  });
});

describe("handleDestroyed", () => {
  let action: AppInstanceStateChangedHandler;

  beforeEach(() => {
    action = appManagerClientMock.onDestroyed.mock.calls[0][0];
  });

  test("should log error if state is not destroyed", async () => {
    const event = mock<AppInstanceStateChanged>({
      state: "running",
      stateVersion: 1,
    });

    await expect(action(event)).rejects.toThrow();

    expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
      state: event.state,
      stateVersion: event.stateVersion,
    });
    expect(appManagerClientMock.offDestroyed).not.toHaveBeenCalled();
    expect(relayMock.delayedDestroy).not.toHaveBeenCalled();
    expect(loggerMock.info).not.toHaveBeenCalled();
  });

  describe("when the event confirms the app is destroyed", () => {
    const event = mock<AppInstanceStateChanged>({
      state: "destroyed",
      stateVersion: 1,
    });

    beforeEach(async () => {
      await action(event);
    });

    test("should unsubscribe from destroyed event", () => {
      expect(appManagerClientMock.offDestroyed).toHaveBeenCalledWith(
        action,
        appInstanceId,
      );
    });

    test("should queue a destroy of all relays", () => {
      expect(relayMock.delayedDestroy).toHaveBeenCalled();
    });

    test("should log the app host is destroyed", () => {
      expect(loggerMock.info).toHaveBeenCalledWith(expect.any(String), {
        state: event.state,
        stateVersion: event.stateVersion,
      });
    });
  });
});

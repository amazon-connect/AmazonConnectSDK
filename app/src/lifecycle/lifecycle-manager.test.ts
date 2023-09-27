/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AppConfig, LifecycleMessage } from "@amazon-connect/app-types";
import { ConnectLogger } from "@amazon-connect/core";
import { MockedClass, MockedObject } from "jest-mock";

import { AmazonConnectApp } from "../amazon-connect-app";
import { AmazonConnectAppConfig } from "../amazon-connect-app-config";
import { AppProxy } from "../proxy";
import {
  AppCreateEvent,
  AppDestroyEvent,
  AppStartEvent,
} from "./lifecycle-change";
import { LifecycleManager } from "./lifecycle-manager";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("../proxy/app-proxy");

const AppProxyMock = AppProxy as MockedClass<typeof AppProxy>;
const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const appInstanceId = "abc123";
const appConfig: AppConfig = { _type: "iframe" } as AppConfig;

const createMsg: LifecycleMessage = {
  type: "appLifecycle",
  stage: "create",
  appInstanceId,
  appConfig,
};

const startMsg: LifecycleMessage = {
  type: "appLifecycle",
  stage: "start",
  appInstanceId,
  appConfig,
};

const stopMsg: LifecycleMessage = {
  type: "appLifecycle",
  stage: "stop",
  appInstanceId,
  appConfig,
};

const destroyMsg: LifecycleMessage = {
  type: "appLifecycle",
  stage: "destroy",
  appInstanceId,
  appConfig,
};

const getLifecycleManagerLogger = () => {
  const idx = LoggerMock.mock.calls.findIndex(
    ([a]) => typeof a === "object" && a.source === "app.lifecycleManager",
  );

  if (idx < 0) throw new Error("LifecycleManager logger not found");

  return LoggerMock.mock.instances[idx];
};

beforeEach(jest.resetAllMocks);

let provider: AmazonConnectApp;
let proxy: MockedObject<AppProxy>;
let sut: LifecycleManager;

describe("when triggering the Create lifecycle event", () => {
  let createHandler: jest.Mock<Promise<void>, [AppCreateEvent]>;

  beforeEach(() => {
    createHandler = jest.fn();
    provider = new AmazonConnectApp({
      onCreate: createHandler,
    });
    proxy = provider.getProxy() as MockedObject<AppProxy>;
    sut = AppProxyMock.mock.calls[0][1];
  });

  describe("when the create handler executes successfully", () => {
    test("should invoke create handler", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      expect(createHandler).toHaveBeenCalled();
    });

    test("should send the LifecycleHandlerCompleted after handler is completed", async () => {
      proxy.sendLifecycleHandlerCompleted.mockImplementation(() => {
        expect(createHandler).toHaveBeenCalled();
      });

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).toHaveBeenCalledWith(
        appInstanceId,
        "create",
      );
      expect.assertions(2);
    });

    test("should not call fatal error when task is successful", async () => {
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).not.toHaveBeenCalled();
    });

    test("should not be running state", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      const state = sut.appState;
      expect(state.isRunning).toBeFalsy();
      expect(state.appInstanceId).toEqual(appInstanceId);
      expect(state.appConfig).toEqual(appConfig);
    });
  });

  describe("when the onCreate errors", () => {
    test("should log error", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
      expect(data?.error).toEqual(error);
    });

    test("should invoke sendFatalError", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).toHaveBeenCalledWith(expect.anything(), error);
    });

    test("should send the LifecycleHandlerCompleted", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).not.toHaveBeenCalled();
    });
  });

  describe("when the onCreate handler is omitted by the app", () => {
    beforeEach(() => {
      jest.resetAllMocks();
      provider = new AmazonConnectApp({} as AmazonConnectAppConfig);
      proxy = provider.getProxy() as MockedObject<AppProxy>;
      sut = AppProxyMock.mock.calls[0][1];
    });

    test("should log error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });

    test("should invoke sendFatalError", async () => {
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).toHaveBeenCalled();
    });

    test("should send the LifecycleHandlerCompleted", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).not.toHaveBeenCalled();
    });
  });

  describe("when attempting to invoke create a second time", () => {
    beforeEach(async () => {
      await sut.handleLifecycleChangeMessage(createMsg);
      createHandler.mockReset();
    });

    test("should log error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });

    test("not invoke handler a second time", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      expect(createHandler).not.toHaveBeenCalled();
    });

    test("should not invoke sendFatalError", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).not.toHaveBeenCalled();
    });

    test("should not send multiple LifecycleHandlerCompleted", async () => {
      expect(proxy.sendLifecycleHandlerCompleted).toHaveBeenCalledTimes(1);

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).toHaveBeenCalledTimes(1);
    });
  });

  describe("when attempting to invoke create after a destroy", () => {
    beforeEach(async () => {
      await sut.handleLifecycleChangeMessage(createMsg);
      await sut.handleLifecycleChangeMessage(destroyMsg);
      createHandler.mockReset();
      proxy.sendLifecycleHandlerCompleted.mockReset();
    });

    test("should log error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });

    test("not invoke handler", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      expect(createHandler).not.toHaveBeenCalled();
    });

    test("should not invoke sendFatalError", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).not.toHaveBeenCalled();
    });

    test("should not send multiple LifecycleHandlerCompleted", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).not.toHaveBeenCalled();
    });
  });
});

describe("when triggering the Start lifecycle event", () => {
  const getReportFromLog = () => {
    const logger = getLifecycleManagerLogger();
    return logger.debug.mock.lastCall![1] as {
      count: number;
      errorCount: number;
    };
  };

  beforeEach(() => {
    provider = new AmazonConnectApp({
      onCreate: () => Promise.resolve(),
    });
    proxy = provider.getProxy() as MockedObject<AppProxy>;
    sut = AppProxyMock.mock.calls[0][1];
  });

  describe("when Create has been invoked prior to Start", () => {
    beforeEach(async () => {
      await sut.handleLifecycleChangeMessage(createMsg);
    });

    test("should complete when no handlers are set", async () => {
      await sut.handleLifecycleChangeMessage(startMsg);

      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(0);
      expect(errorCount).toEqual(0);
    });

    test("should be running state", async () => {
      await sut.handleLifecycleChangeMessage(startMsg);

      const state = sut.appState;
      expect(state.isRunning).toBeTruthy();
      expect(state.appInstanceId).toEqual(appInstanceId);
      expect(state.appConfig).toEqual(appConfig);
    });

    test("should execute the one handler set", async () => {
      const handler = jest.fn();
      sut.onStart(handler, {});

      await sut.handleLifecycleChangeMessage(startMsg);

      expect(handler).toHaveBeenCalled();
      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(1);
      expect(errorCount).toEqual(0);
    });

    test("should invoke a handler once even when set multiple times", async () => {
      const handler = jest.fn();
      sut.onStart(handler, {});
      sut.onStart(handler, {});

      await sut.handleLifecycleChangeMessage(startMsg);

      expect(handler).toHaveBeenCalled();
      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(1);
      expect(errorCount).toEqual(0);
    });

    test("should run with two handlers set", async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      sut.onStart(handler1, {});
      sut.onStart(handler2, {});

      await sut.handleLifecycleChangeMessage(startMsg);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(2);
      expect(errorCount).toEqual(0);
    });

    test("should not run a handler after it has been removed", async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      sut.onStart(handler1, {});
      sut.onStart(handler2, {});
      sut.offStart(handler1);

      await sut.handleLifecycleChangeMessage(startMsg);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(1);
      expect(errorCount).toEqual(0);
    });

    describe("when a handler errors", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const error = new Error("handler error");
      beforeEach(() => {
        sut.onStart(handler1, {});
        sut.onStart(handler2, {});
        handler1.mockRejectedValue(error);
      });

      afterEach(() => {
        const { count, errorCount } = getReportFromLog();
        expect(count).toEqual(2);
        expect(errorCount).toEqual(1);
      });

      test("should log error for handler that failed", async () => {
        const logger = getLifecycleManagerLogger();

        await sut.handleLifecycleChangeMessage(startMsg);

        expect(logger.error).toHaveBeenCalled();
        const data = logger.error.mock.calls[0][1];
        expect(data?.appInstanceId).toEqual(appInstanceId);
        expect(data?.error).toEqual(error);
      });

      test("should not impact successful handler", async () => {
        await sut.handleLifecycleChangeMessage(startMsg);

        expect(handler2).toHaveBeenCalled();
      });

      test("should not call sendFatalError", async () => {
        const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

        await sut.handleLifecycleChangeMessage(startMsg);

        expect(fatalErrorSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("when attempting to invoke before Create", () => {
    test("should not invoke handler", async () => {
      const handler = jest.fn();
      sut.onStart(handler, {});

      await sut.handleLifecycleChangeMessage(startMsg);

      expect(handler).not.toHaveBeenCalled();
    });

    test("should log an error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(startMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });
  });

  describe("when attempting to invoke Start after a destroy", () => {
    beforeEach(async () => {
      await sut.handleLifecycleChangeMessage(createMsg);
      await sut.handleLifecycleChangeMessage(destroyMsg);
    });

    test("should log error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(startMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });

    test("not invoke handler", async () => {
      const handler = jest.fn();
      sut.onStart(handler, {});

      await sut.handleLifecycleChangeMessage(startMsg);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe("when triggering the Stop lifecycle event", () => {
  const getReportFromLog = () => {
    const logger = getLifecycleManagerLogger();
    return logger.debug.mock.lastCall![1] as {
      count: number;
      errorCount: number;
    };
  };

  beforeEach(() => {
    provider = new AmazonConnectApp({
      onCreate: () => Promise.resolve(),
    });
    proxy = provider.getProxy() as MockedObject<AppProxy>;
    sut = AppProxyMock.mock.calls[0][1];
  });

  describe("when Create has been invoked prior to Stop", () => {
    beforeEach(async () => {
      await sut.handleLifecycleChangeMessage(createMsg);
    });

    test("should complete when no handlers are set", async () => {
      await sut.handleLifecycleChangeMessage(stopMsg);

      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(0);
      expect(errorCount).toEqual(0);
    });

    test("should not be running state", async () => {
      await sut.handleLifecycleChangeMessage(startMsg);
      await sut.handleLifecycleChangeMessage(stopMsg);

      const state = sut.appState;
      expect(state.isRunning).toBeFalsy();
      expect(state.appInstanceId).toEqual(appInstanceId);
      expect(state.appConfig).toEqual(appConfig);
    });

    test("should execute the one handler set", async () => {
      const handler = jest.fn();
      sut.onStop(handler);

      await sut.handleLifecycleChangeMessage(stopMsg);

      expect(handler).toHaveBeenCalled();
      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(1);
      expect(errorCount).toEqual(0);
    });

    test("should invoke a handler once even when set multiple times", async () => {
      const handler = jest.fn();
      sut.onStop(handler);
      sut.onStop(handler);

      await sut.handleLifecycleChangeMessage(stopMsg);

      expect(handler).toHaveBeenCalled();
      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(1);
      expect(errorCount).toEqual(0);
    });

    test("should run with two handlers set", async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      sut.onStop(handler1);
      sut.onStop(handler2);

      await sut.handleLifecycleChangeMessage(stopMsg);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(2);
      expect(errorCount).toEqual(0);
    });

    test("should not run a handler after it has been removed", async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      sut.onStop(handler1);
      sut.onStop(handler2);
      sut.offStop(handler1);

      await sut.handleLifecycleChangeMessage(stopMsg);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      const { count, errorCount } = getReportFromLog();
      expect(count).toEqual(1);
      expect(errorCount).toEqual(0);
    });

    describe("when a handler errors", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const error = new Error("handler error");
      beforeEach(() => {
        sut.onStop(handler1);
        sut.onStop(handler2);
        handler1.mockRejectedValue(error);
      });

      afterEach(() => {
        const { count, errorCount } = getReportFromLog();
        expect(count).toEqual(2);
        expect(errorCount).toEqual(1);
      });

      test("should log error for handler that failed", async () => {
        const logger = getLifecycleManagerLogger();

        await sut.handleLifecycleChangeMessage(stopMsg);

        expect(logger.error).toHaveBeenCalled();
        const data = logger.error.mock.calls[0][1];
        expect(data?.appInstanceId).toEqual(appInstanceId);
        expect(data?.error).toEqual(error);
      });

      test("should not impact successful handler", async () => {
        await sut.handleLifecycleChangeMessage(stopMsg);

        expect(handler2).toHaveBeenCalled();
      });

      test("should not call sendFatalError", async () => {
        const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

        await sut.handleLifecycleChangeMessage(stopMsg);

        expect(fatalErrorSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("when attempting to invoke before Create", () => {
    test("should not invoke handler", async () => {
      const handler = jest.fn();
      sut.onStop(handler);

      await sut.handleLifecycleChangeMessage(stopMsg);

      expect(handler).not.toHaveBeenCalled();
    });

    test("should log an error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(stopMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });
  });

  describe("when attempting to invoke Stop after a destroy", () => {
    beforeEach(async () => {
      await sut.handleLifecycleChangeMessage(createMsg);
      await sut.handleLifecycleChangeMessage(destroyMsg);
    });

    test("should log error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(stopMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });

    test("not invoke handler", async () => {
      const handler = jest.fn();
      sut.onStop(handler);

      await sut.handleLifecycleChangeMessage(stopMsg);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe("when triggering the Destroy lifecycle event", () => {
  let destroyHandler: jest.Mock<Promise<void>, [AppDestroyEvent]>;

  describe("when Create has been invoked prior to Destroy", () => {
    describe("when the destroy handler executes successfully", () => {
      beforeEach(async () => {
        destroyHandler = jest.fn();
        provider = new AmazonConnectApp({
          onCreate: () => Promise.resolve(),
          onDestroy: destroyHandler,
        });
        proxy = provider.getProxy() as MockedObject<AppProxy>;
        sut = AppProxyMock.mock.calls[0][1];
        await sut.handleLifecycleChangeMessage(createMsg);
      });

      test("should invoke destroy handler", async () => {
        await sut.handleLifecycleChangeMessage(destroyMsg);

        expect(destroyHandler).toHaveBeenCalled();
      });

      test("should send the LifecycleHandlerCompleted after handler is completed", async () => {
        proxy.sendLifecycleHandlerCompleted.mockImplementation(() => {
          expect(destroyHandler).toHaveBeenCalled();
        });

        await sut.handleLifecycleChangeMessage(destroyMsg);

        expect(proxy.sendLifecycleHandlerCompleted).toHaveBeenCalledWith(
          appInstanceId,
          "destroy",
        );
        expect.assertions(2);
      });

      test("should not call fatal error when task is successful", async () => {
        const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

        await sut.handleLifecycleChangeMessage(destroyMsg);

        expect(fatalErrorSpy).not.toHaveBeenCalled();
      });

      test("should not be running state", async () => {
        await sut.handleLifecycleChangeMessage(startMsg);
        await sut.handleLifecycleChangeMessage(destroyMsg);

        const state = sut.appState;
        expect(state.isRunning).toBeFalsy();
        expect(state.appInstanceId).toEqual(appInstanceId);
        expect(state.appConfig).toEqual(appConfig);
      });
    });

    describe("when the onDestroy errors", () => {
      let error: Error;
      beforeEach(async () => {
        destroyHandler = jest.fn();
        provider = new AmazonConnectApp({
          onCreate: () => Promise.resolve(),
          onDestroy: destroyHandler,
        });
        proxy = provider.getProxy() as MockedObject<AppProxy>;
        sut = AppProxyMock.mock.calls[0][1];
        error = new Error("error in handler");
        destroyHandler.mockRejectedValue(error);
        await sut.handleLifecycleChangeMessage(createMsg);
        proxy.sendLifecycleHandlerCompleted.mockReset();
      });

      test("should log error", async () => {
        const logger = getLifecycleManagerLogger();

        await sut.handleLifecycleChangeMessage(destroyMsg);

        expect(logger.error).toHaveBeenCalled();
        const data = logger.error.mock.calls[0][1];
        expect(data?.appInstanceId).toEqual(appInstanceId);
        expect(data?.error).toEqual(error);
      });

      test("should invoke sendFatalError", async () => {
        const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

        await sut.handleLifecycleChangeMessage(destroyMsg);

        expect(fatalErrorSpy).toHaveBeenCalledWith(expect.anything(), error);
      });

      test("should send the LifecycleHandlerCompleted", async () => {
        await sut.handleLifecycleChangeMessage(destroyMsg);

        expect(proxy.sendLifecycleHandlerCompleted).not.toHaveBeenCalled();
      });
    });

    describe("when the onDestroy handler is omitted by the app", () => {
      beforeEach(async () => {
        provider = new AmazonConnectApp({ onCreate: jest.fn() });
        proxy = provider.getProxy() as MockedObject<AppProxy>;
        sut = AppProxyMock.mock.calls[0][1];
        await sut.handleLifecycleChangeMessage(createMsg);
        proxy.sendLifecycleHandlerCompleted.mockReset();
      });

      test("should send the LifecycleHandlerCompleted after handler is completed", async () => {
        await sut.handleLifecycleChangeMessage(destroyMsg);

        expect(proxy.sendLifecycleHandlerCompleted).toHaveBeenCalledWith(
          appInstanceId,
          "destroy",
        );
      });

      test("should not call fatal error when task is successful", async () => {
        const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

        await sut.handleLifecycleChangeMessage(destroyMsg);

        expect(fatalErrorSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("when attempting to invoke before Create", () => {
    beforeEach(() => {
      destroyHandler = jest.fn();
      provider = new AmazonConnectApp({
        onCreate: () => Promise.resolve(),
        onDestroy: destroyHandler,
      });
      proxy = provider.getProxy() as MockedObject<AppProxy>;
      sut = AppProxyMock.mock.calls[0][1];
    });

    test("should not invoke handler", async () => {
      await sut.handleLifecycleChangeMessage(destroyMsg);

      expect(destroyHandler).not.toHaveBeenCalled();
    });

    test("should log an error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(destroyMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });
  });

  describe("when attempting to call destroy an additional time", () => {
    beforeEach(async () => {
      destroyHandler = jest.fn();
      provider = new AmazonConnectApp({
        onCreate: () => Promise.resolve(),
        onDestroy: destroyHandler,
      });
      proxy = provider.getProxy() as MockedObject<AppProxy>;
      sut = AppProxyMock.mock.calls[0][1];
      await sut.handleLifecycleChangeMessage(createMsg);
      await sut.handleLifecycleChangeMessage(destroyMsg);
      destroyHandler.mockReset();
    });

    test("should not invoke handler", async () => {
      await sut.handleLifecycleChangeMessage(destroyMsg);

      expect(destroyHandler).not.toHaveBeenCalled();
    });

    test("should log an error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(destroyMsg);

      expect(logger.error).toHaveBeenCalledTimes(1);
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
    });
  });
});

describe("when calling onStart with invokeIfRunning", () => {
  beforeEach(() => {
    provider = new AmazonConnectApp({
      onCreate: () => Promise.resolve(),
    });
    proxy = provider.getProxy() as MockedObject<AppProxy>;
    sut = AppProxyMock.mock.calls[0][1];
  });

  test("should not invoke handler if no events are set", () => {
    const handler = jest.fn();

    sut.onStart(handler, { invokeIfRunning: true });

    expect(handler).not.toHaveBeenCalled();
  });

  test("should not invoke handler if app has created but not started", async () => {
    const handler = jest.fn();
    await sut.handleLifecycleChangeMessage(createMsg);

    sut.onStart(handler, { invokeIfRunning: true });

    expect(handler).not.toHaveBeenCalled();
  });

  describe("when the app is running", () => {
    beforeEach(async () => {
      await sut.handleLifecycleChangeMessage(createMsg);
      await sut.handleLifecycleChangeMessage(startMsg);
    });

    test("should invoke the handler", (done) => {
      const handler = jest
        .fn<Promise<void>, [AppStartEvent]>()
        .mockImplementation((evt) => {
          expect(evt.stage).toEqual("start");
          expect(evt.context.appInstanceId).toEqual(appInstanceId);
          expect(evt.context.appConfig).toEqual(appConfig);

          done();
          return Promise.resolve();
        });

      sut.onStart(handler, { invokeIfRunning: true });

      expect.hasAssertions();
    });

    test("should log an error thrown by handler", async () => {
      const error = new Error("handler error");
      const handler = jest
        .fn<Promise<void>, [AppStartEvent]>()
        .mockRejectedValue(error);
      const logger = getLifecycleManagerLogger();

      sut.onStart(handler, { invokeIfRunning: true });

      expect(handler).toHaveBeenCalled();
      // There is no way to wait for an error to occur and then evaluate the
      // steps after without doing a short sleep
      while (logger.error.mock.calls.length < 1)
        await new Promise((r) => setTimeout(r, 1));
      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.appInstanceId).toEqual(appInstanceId);
      expect(data?.error).toEqual(error);
    });
  });

  test("should not invoke handler if app has stopped", async () => {
    const handler = jest.fn();
    await sut.handleLifecycleChangeMessage(createMsg);
    await sut.handleLifecycleChangeMessage(startMsg);
    await sut.handleLifecycleChangeMessage(stopMsg);

    sut.onStart(handler, { invokeIfRunning: true });

    expect(handler).not.toHaveBeenCalled();
  });

  test("should not invoke handler if app has destroyed", async () => {
    const handler = jest.fn();
    await sut.handleLifecycleChangeMessage(createMsg);
    await sut.handleLifecycleChangeMessage(startMsg);
    await sut.handleLifecycleChangeMessage(destroyMsg);

    sut.onStart(handler, { invokeIfRunning: true });

    expect(handler).not.toHaveBeenCalled();
  });
});

test("should have not running state before any lifecycle events occur", () => {
  provider = new AmazonConnectApp({
    onCreate: () => Promise.resolve(),
  });
  proxy = provider.getProxy() as MockedObject<AppProxy>;
  sut = AppProxyMock.mock.calls[0][1];

  const state = sut.appState;

  expect(state.isRunning).toBeFalsy();
  expect(state.appInstanceId).toBeUndefined();
  expect(state.appConfig).toBeUndefined();
});

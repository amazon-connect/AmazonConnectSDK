import {
  AppHost,
  AppHostStore,
  AppScopeKey,
} from "@amazon-connect/app-manager";
import {
  AmazonConnectProvider,
  ConnectLogger,
  ConnectLoggerMixin,
  LogLevel,
  Proxy,
} from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import {
  AppScopeAppUpdated,
  AppScopeAppUpdatedHandler,
} from "../../app-scope-events";
import { AppScopeGroup } from "../../app-scope-group";
import {
  AppHostInScopeGroupAddedHandler,
  AppHostInScopeGroupDestroyingHandler,
  AppHostInScopeGroupRemovedHandler,
} from "../../app-scope-group-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";
import { AppScopeAppAddedRelay } from "./app-scope-app-added-relay";
import { AppScopeAppDestroyingRelay } from "./app-scope-app-destroying-relay";
import { AppScopeAppRemovedRelay } from "./app-scope-app-removed-relay";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const proxyMock = mock<Proxy>();
const provider = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});
const appHostStore = mock<AppHostStore>();
const appScopeGroupStore = mock<AppScopeGroupStore>();
const appInstanceId = "app-instance-id";
const appHost = mock<AppHost>();
const scopeGroup = mock<AppScopeGroup>();
const testScope: AppScope = { type: "contact", contactId: "foo" };
const testKey: AppScopeKey = "contact/foo";
const loggerInstance = 1;

beforeEach(jest.resetAllMocks);

describe("AppScopeAppAddedRelay", () => {
  let sut: AppScopeAppAddedRelay;
  const handler: MockedObject<AppHostInScopeGroupAddedHandler> = jest.fn();
  let internalHandler: AppScopeAppUpdatedHandler;
  let loggerMock: MockedObject<ConnectLogger>;

  beforeEach(() => {
    sut = new AppScopeAppAddedRelay({
      provider,
      appHostStore,
      appScopeGroupStore,
    });

    sut.on(handler);
    internalHandler = proxyMock.subscribe.mock.calls[0][1];
    loggerMock = mocked(ConnectLogger).mock.instances[loggerInstance];
  });

  describe("constructor", () => {
    test("should create logger with scope in mixin", () => {
      expect(ConnectLogger).toHaveBeenCalledWith({
        provider,
        source: expect.any(String) as string,
        mixin: expect.any(Function) as ConnectLoggerMixin,
      });
      const loggerConfig = mocked(ConnectLogger).mock.calls[loggerInstance][0];
      if (typeof loggerConfig === "string") throw Error("ts needs this");
      const mixin = loggerConfig.mixin!;
      const mixinResult = mixin({}, LogLevel.info);
      expect(mixinResult.updateType).toEqual("added");
    });
  });

  describe("when the updateType is added", () => {
    test("should invoke handler", async () => {
      const evt: AppScopeAppUpdated = {
        appInstanceId,
        updateType: "added",
        scope: testScope,
        key: testKey,
      };
      appHostStore.get.mockReturnValueOnce(appHost);
      appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

      await internalHandler(evt);

      expect(handler).toHaveBeenCalledWith({ appHost, scopeGroup });
      expect(appHostStore.get).toHaveBeenCalledWith(appInstanceId);
      expect(appScopeGroupStore.get).toHaveBeenCalledWith({
        scope: testScope,
        key: testKey,
      });
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the updateType is not added", () => {
    test("should not invoke handler", async () => {
      const evt: AppScopeAppUpdated = {
        appInstanceId,
        updateType: "destroying",
        scope: testScope,
        key: testKey,
      };
      appHostStore.get.mockReturnValueOnce(appHost);
      appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

      await internalHandler(evt);

      expect(handler).not.toHaveBeenCalled();
      expect(appHostStore.get).not.toHaveBeenCalled();
      expect(appScopeGroupStore.get).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when app host is not found", () => {
    test("should log, throw error and not invoke handler", async () => {
      const evt: AppScopeAppUpdated = {
        appInstanceId,
        updateType: "added",
        scope: testScope,
        key: testKey,
      };
      appHostStore.get.mockReturnValueOnce(undefined);
      appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

      await internalHandler(evt);

      expect(handler).not.toHaveBeenCalled();
      expect(appHostStore.get).toHaveBeenCalledWith(appInstanceId);
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        appInstanceId,
      });
    });
  });
});

describe("AppScopeAppDestroyingRelay", () => {
  let sut: AppScopeAppDestroyingRelay;
  const handler: MockedObject<AppHostInScopeGroupDestroyingHandler> = jest.fn();
  let internalHandler: AppScopeAppUpdatedHandler;
  let loggerMock: MockedObject<ConnectLogger>;

  beforeEach(() => {
    sut = new AppScopeAppDestroyingRelay({
      provider,
      appHostStore,
      appScopeGroupStore,
    });

    sut.on(handler);
    internalHandler = proxyMock.subscribe.mock.calls[0][1];
    loggerMock = mocked(ConnectLogger).mock.instances[loggerInstance];
  });

  describe("constructor", () => {
    test("should create logger with scope in mixin", () => {
      expect(ConnectLogger).toHaveBeenCalledWith({
        provider,
        source: expect.any(String) as string,
        mixin: expect.any(Function) as ConnectLoggerMixin,
      });
      const loggerConfig = mocked(ConnectLogger).mock.calls[loggerInstance][0];
      if (typeof loggerConfig === "string") throw Error("ts needs this");
      const mixin = loggerConfig.mixin!;
      const mixinResult = mixin({}, LogLevel.info);
      expect(mixinResult.updateType).toEqual("destroying");
    });
  });

  describe("when the updateType is destroying", () => {
    test("should invoke handler", async () => {
      const evt: AppScopeAppUpdated = {
        appInstanceId,
        updateType: "destroying",
        scope: testScope,
        key: testKey,
      };
      appHostStore.get.mockReturnValueOnce(appHost);
      appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

      await internalHandler(evt);

      expect(handler).toHaveBeenCalledWith({ appHost, scopeGroup });
      expect(appHostStore.get).toHaveBeenCalledWith(appInstanceId);
      expect(appScopeGroupStore.get).toHaveBeenCalledWith({
        scope: testScope,
        key: testKey,
      });
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the updateType is not destroying", () => {
    test("should not invoke handler", async () => {
      const evt: AppScopeAppUpdated = {
        appInstanceId,
        updateType: "removed",
        scope: testScope,
        key: testKey,
      };
      appHostStore.get.mockReturnValueOnce(appHost);
      appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

      await internalHandler(evt);

      expect(handler).not.toHaveBeenCalled();
      expect(appHostStore.get).not.toHaveBeenCalled();
      expect(appScopeGroupStore.get).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when app host is not found", () => {
    test("should log, throw error and not invoke handler", async () => {
      const evt: AppScopeAppUpdated = {
        appInstanceId,
        updateType: "destroying",
        scope: testScope,
        key: testKey,
      };
      appHostStore.get.mockReturnValueOnce(undefined);
      appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

      await internalHandler(evt);

      expect(handler).not.toHaveBeenCalled();
      expect(appHostStore.get).toHaveBeenCalledWith(appInstanceId);
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        appInstanceId,
      });
    });
  });
});

describe("AppScopeAppRemovedRelay", () => {
  let sut: AppScopeAppRemovedRelay;
  const handler: MockedObject<AppHostInScopeGroupRemovedHandler> = jest.fn();
  let internalHandler: AppScopeAppUpdatedHandler;
  let loggerMock: MockedObject<ConnectLogger>;

  beforeEach(() => {
    sut = new AppScopeAppRemovedRelay({
      provider,
      appHostStore,
      appScopeGroupStore,
    });

    sut.on(handler);
    internalHandler = proxyMock.subscribe.mock.calls[0][1];
    loggerMock = mocked(ConnectLogger).mock.instances[loggerInstance];
  });

  describe("constructor", () => {
    test("should create logger with scope in mixin", () => {
      expect(ConnectLogger).toHaveBeenCalledWith({
        provider,
        source: expect.any(String) as string,
        mixin: expect.any(Function) as ConnectLoggerMixin,
      });
      const loggerConfig = mocked(ConnectLogger).mock.calls[loggerInstance][0];
      if (typeof loggerConfig === "string") throw Error("ts needs this");
      const mixin = loggerConfig.mixin!;
      const mixinResult = mixin({}, LogLevel.info);
      expect(mixinResult.updateType).toEqual("removed");
    });
  });

  describe("when the updateType is removed", () => {
    test("should invoke handler", async () => {
      const evt: AppScopeAppUpdated = {
        appInstanceId,
        updateType: "removed",
        scope: testScope,
        key: testKey,
      };
      appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

      await internalHandler(evt);

      expect(handler).toHaveBeenCalledWith({ appInstanceId, scopeGroup });
      expect(appScopeGroupStore.get).toHaveBeenCalledWith({
        scope: testScope,
        key: testKey,
      });
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the updateType is not removed", () => {
    test("should not invoke handler", async () => {
      const evt: AppScopeAppUpdated = {
        appInstanceId,
        updateType: "added",
        scope: testScope,
        key: testKey,
      };
      appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

      await internalHandler(evt);

      expect(handler).not.toHaveBeenCalled();
      expect(appScopeGroupStore.get).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });
});

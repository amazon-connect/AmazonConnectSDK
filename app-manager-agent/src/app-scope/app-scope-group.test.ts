import { AppHost, AppHostStore } from "@amazon-connect/app-manager";
import {
  AmazonConnectProvider,
  ConnectLogger,
  ConnectLoggerMixin,
  LogLevel,
} from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";
import { mocked, MockedObject } from "jest-mock";
import { mock, mockDeep } from "jest-mock-extended";

import { AgentAppManagerClient } from "../agent-app-manager-client";
import {
  AppScopeGroupData,
  GetScopeGroupOptions,
  ModifyScopeGroupStateOptions,
  StartScopeResult,
  StoppedScopeResult,
} from "../types";
import { AppScopeGroup } from "./app-scope-group";
import { AppScopeGroupEventManager } from "./event-relay";

jest.mock("../agent-app-manager-client");
jest.mock("./event-relay");
jest.mock("@amazon-connect/app-manager/lib/manager/app-host-store");
jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const provider = mock<AmazonConnectProvider>();
const appHostStoreMock = mock<AppHostStore>();
const eventManagerMock = mockDeep<AppScopeGroupEventManager>();

let sut: AppScopeGroup;
let loggerMock: MockedObject<ConnectLogger>;
let workspaceClientMock: MockedObject<AgentAppManagerClient>;

const scope: AppScope = { type: "contact", contactId: "foo" };
const key = "contact/foo";

const expectedGetScopeOptions: GetScopeGroupOptions = {
  includeAppsWithoutScope: true,
};

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AppScopeGroup({
    scope,
    key,
    provider,
    appHostStore: appHostStoreMock,
    eventManager: eventManagerMock,
  });

  loggerMock = mocked(ConnectLogger).mock.instances[0];
  workspaceClientMock = mocked(AgentAppManagerClient).mock.instances[0];
});

describe("constructor", () => {
  test("should create workspace client with provider", () => {
    expect(AgentAppManagerClient).toHaveBeenCalledTimes(1);
    expect(AgentAppManagerClient).toHaveBeenCalledWith({ provider });
  });

  test("should create logger with scope in mixin", () => {
    expect(ConnectLogger).toHaveBeenCalledWith({
      provider,
      source: "workspace.app-scope-group",
      mixin: expect.any(Function) as ConnectLoggerMixin,
    });
    const loggerConfig = mocked(ConnectLogger).mock.calls[0][0];
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;
    const mixinResult = mixin({}, LogLevel.info);
    expect(mixinResult.scope).toEqual(scope);
  });
});

describe("getAppHosts", () => {
  describe("when the scope group exists", () => {
    const activeAppInstanceIds = ["a", "b", "c"];
    const destroyingAppInstanceIds = ["y", "z"];

    beforeEach(() => {
      workspaceClientMock.getScopeGroup.mockResolvedValueOnce(
        mock<AppScopeGroupData>({
          activeAppInstanceIds,
          destroyingAppInstanceIds,
        }),
      );
    });

    describe("when including destroying apps", () => {
      test("should return all appHosts", async () => {
        const hosts = [mock<AppHost>(), mock<AppHost>(), mock<AppHost>()];
        appHostStoreMock.getBatch.mockReturnValueOnce({ hosts });

        const result = await sut.getAppHosts({ includeDestroying: true });

        expect(result).toEqual(expect.arrayContaining(hosts));
        expect(appHostStoreMock.getBatch).toHaveBeenCalledWith(
          expect.arrayContaining([
            ...activeAppInstanceIds,
            ...destroyingAppInstanceIds,
          ]),
        );
        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });

    describe("when not including destroying apps", () => {
      test("should return only active appHosts", async () => {
        const hosts = [mock<AppHost>(), mock<AppHost>(), mock<AppHost>()];
        appHostStoreMock.getBatch.mockReturnValueOnce({ hosts });

        const result = await sut.getAppHosts({ includeDestroying: false });

        expect(result).toEqual(expect.arrayContaining(hosts));
        expect(appHostStoreMock.getBatch).toHaveBeenCalledWith(
          activeAppInstanceIds,
        );
        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });

    test("should sort appHosts by create order", async () => {
      const appHost1 = mock<AppHost>({ appCreateOrder: 1 });
      const appHost2 = mock<AppHost>({ appCreateOrder: 2 });
      const appHost3 = mock<AppHost>({ appCreateOrder: 3 });
      const appHost4 = mock<AppHost>({ appCreateOrder: 4 });

      const hosts = [appHost3, appHost2, appHost1, appHost4];
      appHostStoreMock.getBatch.mockReturnValueOnce({ hosts });

      const result = await sut.getAppHosts();

      expect(result).toEqual([appHost1, appHost2, appHost3, appHost4]);
      expect(appHostStoreMock.getBatch).toHaveBeenCalledWith(
        activeAppInstanceIds,
      );
    });

    test("should return no appHosts", async () => {
      appHostStoreMock.getBatch.mockReturnValueOnce({ hosts: [] });

      const result = await sut.getAppHosts();

      expect(result).toHaveLength(0);
    });

    describe("when appHosts values are missing", () => {
      test("should log warning but return existing", async () => {
        const hosts = [mock<AppHost>(), mock<AppHost>(), mock<AppHost>()];
        const missingValues = ["missing1", "missing2"];
        appHostStoreMock.getBatch.mockReturnValueOnce({
          hosts,
          missingValues,
        });

        const result = await sut.getAppHosts();

        expect(result).toEqual(expect.arrayContaining(hosts));
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String), {
          missingValues: expect.arrayContaining(missingValues) as string[],
        });
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });
  });

  describe("when the scope group does not exist", () => {
    test("should log error and throw", async () => {
      workspaceClientMock.getScopeGroup.mockResolvedValueOnce(undefined);

      try {
        await sut.getAppHosts();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(loggerMock.error).toHaveBeenCalled();
        expect(workspaceClientMock.getScopeGroup).toHaveBeenCalledWith(
          key,
          expectedGetScopeOptions,
        );
      }

      expect.hasAssertions();
    });
  });
});

describe("onAppHostAdded", () => {
  test("should add handler", () => {
    const handler = jest.fn();

    sut.onAppHostAdded(handler);

    expect(eventManagerMock.appAddedRelay.on).toHaveBeenCalledWith(
      handler,
      key,
    );
  });
});

describe("offAppHostAdded", () => {
  test("should remove handler", () => {
    const handler = jest.fn();

    sut.offAppHostAdded(handler);

    expect(eventManagerMock.appAddedRelay.off).toHaveBeenCalledWith(
      handler,
      key,
    );
  });
});

describe("onAppHostDestroying", () => {
  test("should add handler", () => {
    const handler = jest.fn();

    sut.onAppHostDestroying(handler);

    expect(eventManagerMock.appDestroyingRelay.on).toHaveBeenCalledWith(
      handler,
      key,
    );
  });
});

describe("offAppHostDestroying", () => {
  test("should remove handler", () => {
    const handler = jest.fn();

    sut.offAppHostDestroying(handler);

    expect(eventManagerMock.appDestroyingRelay.off).toHaveBeenCalledWith(
      handler,
      key,
    );
  });
});

describe("onAppHostRemoved", () => {
  test("should add handler", () => {
    const handler = jest.fn();

    sut.onAppHostRemoved(handler);

    expect(eventManagerMock.appRemovedRelay.on).toHaveBeenCalledWith(
      handler,
      key,
    );
  });
});

describe("offAppHostRemoved", () => {
  test("should remove handler", () => {
    const handler = jest.fn();

    sut.offAppHostRemoved(handler);

    expect(eventManagerMock.appRemovedRelay.off).toHaveBeenCalledWith(
      handler,
      key,
    );
  });
});

describe("startAll", () => {
  test("should request all apps started", async () => {
    const options = mock<ModifyScopeGroupStateOptions>();
    const expected = mock<StartScopeResult>();
    workspaceClientMock.startScopeGroup.mockResolvedValueOnce(expected);

    const result = await sut.startAll(options);

    expect(result).toEqual(expected);
    expect(workspaceClientMock.startScopeGroup).toHaveBeenCalledWith(
      key,
      options,
    );
  });
});

describe("stopAll", () => {
  test("should request all apps stopped", async () => {
    const options = mock<ModifyScopeGroupStateOptions>();
    const expected = mock<StoppedScopeResult>();
    workspaceClientMock.stopScopeGroup.mockResolvedValueOnce(expected);

    const result = await sut.stopAll(options);

    expect(result).toEqual(expected);
    expect(workspaceClientMock.stopScopeGroup).toHaveBeenCalledWith(
      key,
      options,
    );
  });
});

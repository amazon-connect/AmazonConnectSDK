import {
  AmazonConnectProvider,
  AsyncEventEmitter,
  ConnectLogger,
} from "@amazon-connect/core";
import { AppConfig } from "@amazon-connect/workspace-types";
import { mocked, MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import {
  AppHost,
  AppHostAdded,
  AppHostRemoved,
  AppInstanceData,
  AppInstanceStateChanged,
  AppInstanceStateChangedHandler,
  createAppHost,
} from "../app";
import { AppFocusRelay } from "../app/host";
import { AppManagerClient } from "../app-manager-client";
import { ClearAppManagerResult } from "../types";
import { AppHostStore } from "./app-host-store";
import { AppLaunchOptions } from "./app-launch-options";
import { AppManager } from "./app-manager";

jest.mock("./app-host-store"); 
jest.mock("../app-manager-client");
jest.mock("../app/host/app-focus-relay");
jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/emitter/async-event-emitter");
jest.mock("../app/host/app-host-factory");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const provider = mock<AmazonConnectProvider>();
let sut: AppManager;
 
let loggerMock: MockedObject<ConnectLogger>;
let hostStoreMock: MockedObject<AppHostStore>;
let appManagerClientMock: MockedObject<AppManagerClient>;
let addedEmitterMock: MockedObject<AsyncEventEmitter<AppHostAdded>>;
let removedEmitterMock: MockedObject<AsyncEventEmitter<AppHostRemoved>>;
let appFocusRelayMock: MockedObject<AppFocusRelay>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AppManager({ provider });

  loggerMock = LoggerMock.mock.instances[0];
  hostStoreMock = mocked(AppHostStore).mock.instances[0];
  appManagerClientMock = mocked(AppManagerClient).mock.instances[0];
  addedEmitterMock = mocked(AsyncEventEmitter<AppHostAdded>).mock.instances[0];
  removedEmitterMock = mocked(AsyncEventEmitter<AppHostRemoved>).mock
    .instances[1];
  appFocusRelayMock = mocked(AppFocusRelay).mock.instances[0];
});

describe("constructor", () => {
  test("should create AppManagerClient with provider", () => {
    expect(AppManagerClient).toHaveBeenCalledTimes(1);
    expect(AppManagerClient).toHaveBeenCalledWith({ provider });
  });

  test("should create addedEmitter with loggerKey", () => {
    expect(AsyncEventEmitter).toHaveBeenCalledWith({
      provider,
      loggerKey: "appHostAdded",
    });
  });

  test("should create removed with loggerKey", () => {
    expect(AsyncEventEmitter).toHaveBeenCalledWith({
      provider,
      loggerKey: "appHostRemoved",
    });
  });

  test("should create appFocusRelay", () => {
    expect(AppFocusRelay).toHaveBeenCalledWith({
      provider,
      getHost: expect.any(Function) as () => void,
    });

    const getHostFunction = (
      mocked(AppFocusRelay).mock.calls[0][0] as {
        getHost: (instanceId: string) => AppHost | undefined;
      }
    ).getHost;
    const appInstanceId = "app-instance-id";
    const appHost = mock<AppHost>({ appInstanceId });
    hostStoreMock.get.mockReturnValueOnce(appHost);

    const result = getHostFunction(appInstanceId);

    expect(result).toEqual(appHost);
    expect(hostStoreMock.get).toHaveBeenCalledWith(appInstanceId);
  });
});

describe("launchApp", () => {
  describe("when appHost is already created", () => {
    test("should create instance and return existing app host", async () => {
      const arn = "test-arn";
      const instanceId = "test-instance-id";
      const options = mock<AppLaunchOptions>();
      const instanceData = mock<AppInstanceData>({ instanceId });
      const appHost = mock<AppHost>();
      appManagerClientMock.launchApp.mockResolvedValueOnce(instanceData);
      hostStoreMock.get.mockReturnValueOnce(appHost);

      const result = await sut.launchApp(arn, options);

      expect(result).toEqual(appHost);
      expect(appManagerClientMock.launchApp).toHaveBeenCalledWith(arn, options);
      expect(hostStoreMock.get).toHaveBeenCalledWith(instanceId);
      expect(createAppHost).not.toHaveBeenCalled();
    });
  });

  describe("when appHost does not exist", () => {
    test("should create instance and return new app host", async () => {
      const arn = "test-arn";
      const instanceId = "test-instance-id";
      const options = mock<AppLaunchOptions>();
      const instanceData = mock<AppInstanceData>({ instanceId });
      const appHost = mock<AppHost>();
      appManagerClientMock.launchApp.mockResolvedValueOnce(instanceData);
      hostStoreMock.get.mockReturnValueOnce(undefined);
      mocked(createAppHost).mockReturnValueOnce(appHost);

      const result = await sut.launchApp(arn, options);

      expect(result).toEqual(appHost);
      expect(appManagerClientMock.launchApp).toHaveBeenCalledWith(arn, options);
      expect(hostStoreMock.get).toHaveBeenCalledWith(instanceId);
      expect(createAppHost).toHaveBeenCalledWith({ ...instanceData, provider });
      expect(hostStoreMock.set).toHaveBeenCalledWith(appHost);
    });
  });
});

describe("getAppHost", () => {
  test("should get value when exists", () => {
    const appInstanceId = "app-instance-id";
    const appHost = mock<AppHost>({ appInstanceId });
    hostStoreMock.get.mockReturnValueOnce(appHost);

    const result = sut.getAppHost(appInstanceId);

    expect(result).toEqual(appHost);
    expect(hostStoreMock.get).toHaveBeenCalledWith(appInstanceId);
  });

  test("should get undefined when does not exist", () => {
    const appInstanceId = "app-instance-id";
    hostStoreMock.get.mockReturnValueOnce(undefined);

    const result = sut.getAppHost(appInstanceId);

    expect(result).toBeUndefined();
    expect(hostStoreMock.get).toHaveBeenCalledWith(appInstanceId);
  });
});

describe("getAppHosts", () => {
  test("should get all values", () => {
    const appHosts = [mock<AppHost>(), mock<AppHost>()];
    hostStoreMock.getAll.mockReturnValueOnce(appHosts);

    const result = sut.getAppHosts();

    expect(result).toEqual(appHosts);
    expect(hostStoreMock.getAll).toHaveBeenCalled();
  });
});

describe("listAppHosts", () => {
  test("should list all values", () => {
    const appHosts = [mock<AppHost>(), mock<AppHost>()];
    hostStoreMock.getAll.mockReturnValueOnce(appHosts);

    const result = sut.listAppHosts();

    expect(result).toEqual(appHosts);
    expect(hostStoreMock.getAll).toHaveBeenCalled();
  });
});

describe("onAppHostAdded", () => {
  test("should add handler to emitter", () => {
    const handler = jest.fn();

    sut.onAppHostAdded(handler);

    expect(addedEmitterMock.on).toHaveBeenCalledWith(
      AppManager["ALL_APP_INSTANCES"],
      handler,
    );
  });
});

describe("offAppHostAdded", () => {
  test("should remove handler to emitter", () => {
    const handler = jest.fn();

    sut.offAppHostAdded(handler);

    expect(addedEmitterMock.off).toHaveBeenCalledWith(
      AppManager["ALL_APP_INSTANCES"],
      handler,
    );
  });
});

describe("onAppHostRemoved", () => {
  test("should add handler to emitter without parameter", () => {
    const handler = jest.fn();

    sut.onAppHostRemoved(handler);

    expect(removedEmitterMock.on).toHaveBeenCalledWith(
      AppManager["ALL_APP_INSTANCES"],
      handler,
    );
  });

  test("should add handler to emitter without parameter", () => {
    const handler = jest.fn();
    const appInstanceId = "app-instance-id";

    sut.onAppHostRemoved(handler, appInstanceId);

    expect(removedEmitterMock.on).toHaveBeenCalledWith(appInstanceId, handler);
  });
});

describe("offAppHostRemoved", () => {
  test("should remove handler to emitter without parameter", () => {
    const handler = jest.fn();

    sut.offAppHostRemoved(handler);

    expect(removedEmitterMock.off).toHaveBeenCalledWith(
      AppManager["ALL_APP_INSTANCES"],
      handler,
    );
  });

  test("should remove handler to emitter without parameter", () => {
    const handler = jest.fn();
    const appInstanceId = "app-instance-id";

    sut.offAppHostRemoved(handler, appInstanceId);

    expect(removedEmitterMock.off).toHaveBeenCalledWith(appInstanceId, handler);
  });
});

describe("onAppHostFocused", () => {
  test("should add handler to relay", () => {
    const handler = jest.fn();

    sut.onAppHostFocused(handler);

    expect(appFocusRelayMock.on).toHaveBeenCalledWith(handler);
  });
});

describe("offAppHostFocused", () => {
  test("should add handler to relay", () => {
    const handler = jest.fn();

    sut.offAppHostFocused(handler);

    expect(appFocusRelayMock.off).toHaveBeenCalledWith(handler);
  });
});

describe("handleAppAdded", () => {
  let addAction: AppInstanceStateChangedHandler;

  beforeEach(() => {
    addAction = appManagerClientMock.onProvisioned.mock.calls[0][0];
  });

  describe("when the app host exists", () => {
    test("should emit the event with the existing app host", async () => {
      const appInstanceId = "app-instance-id";
      const appHost = mock<AppHost>({ appInstanceId });
      const evt = mock<AppInstanceStateChanged>({ appInstanceId });
      hostStoreMock.get.mockReturnValueOnce(appHost);

      await addAction(evt);

      expect(addedEmitterMock.emit).toHaveBeenCalledWith(
        AppManager["ALL_APP_INSTANCES"],
        { appHost },
      );
      expect(hostStoreMock.get).toHaveBeenCalledWith(appInstanceId);
      expect(createAppHost).not.toHaveBeenCalled();
      expect(loggerMock.info).not.toHaveBeenCalled();
    });
  });

  describe("when the app host does not exist", () => {
    test("should emit the event with the existing app host", async () => {
      const appInstanceId = "app-instance-id";
      const appHost = mock<AppHost>({ appInstanceId });
      const evt = mock<AppInstanceStateChanged>({ appInstanceId });
      hostStoreMock.get.mockReturnValueOnce(undefined);
      mocked(createAppHost).mockReturnValueOnce(appHost);

      await addAction(evt);

      expect(addedEmitterMock.emit).toHaveBeenCalledWith(
        AppManager["ALL_APP_INSTANCES"],
        { appHost },
      );
      expect(hostStoreMock.get).toHaveBeenCalledWith(appInstanceId);
      expect(createAppHost).toHaveBeenCalledWith({ ...evt, provider });
      expect(hostStoreMock.set).toHaveBeenCalledWith(appHost);
      expect(loggerMock.info).toHaveBeenCalledWith(expect.any(String), {
        appInstanceId,
      });
    });
  });
});

describe("handleRemovedAdded", () => {
  let removeAction: AppInstanceStateChangedHandler;

  beforeEach(() => {
    removeAction = appManagerClientMock.onDestroyed.mock.calls[0][0];
  });

  describe("when the app host exists", () => {
    test("should emit the event with the existing app host and parameter", async () => {
      const appInstanceId = "app-instance-id";
      const appHost = mock<AppHost>({ appInstanceId });
      const evt = mock<AppInstanceStateChanged>({ appInstanceId });
      hostStoreMock.get.mockReturnValueOnce(appHost);

      await removeAction(evt);

      expect(removedEmitterMock.emit).toHaveBeenCalledWith(appInstanceId, {
        appHost,
      });
      expect(removedEmitterMock.emit).toHaveBeenCalledWith(
        AppManager["ALL_APP_INSTANCES"],
        { appHost },
      );
      expect(hostStoreMock.get).toHaveBeenCalledWith(appInstanceId);
      expect(hostStoreMock.delete).toHaveBeenCalledWith(appInstanceId);
      expect(loggerMock.info).toHaveBeenCalledWith(expect.any(String), {
        appInstanceId,
      });
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });
  });

  describe("when the app host does not exist", () => {
    test("should not emit the event and warn", async () => {
      const appInstanceId = "app-instance-id";
      const evt = mock<AppInstanceStateChanged>({ appInstanceId });
      hostStoreMock.get.mockReturnValueOnce(undefined);

      await removeAction(evt);

      expect(removedEmitterMock.emit).not.toHaveBeenCalled();
      expect(hostStoreMock.get).toHaveBeenCalledWith(appInstanceId);
      expect(hostStoreMock.delete).toHaveBeenCalledWith(appInstanceId);
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String), {
        appInstanceId,
      });
    });
  });
});

describe("destroyAllInstances", () => {
  test("should call destroy instances and return ids", async () => {
    const appInstances = mock<{ appInstanceIds: string[] }>();
    appManagerClientMock.destroyAllInstances.mockResolvedValueOnce(appInstances);

    const result = await sut.destroyAllInstances();

    expect(result).toEqual(appInstances);
    expect(appManagerClientMock.destroyAllInstances).toHaveBeenCalledTimes(1);
  });
});

describe("clearAppManager", () => {
  test("should call destroy instances and return ids", async () => {
    const clearResult = mock<ClearAppManagerResult>();
    appManagerClientMock.clearAppManager.mockResolvedValueOnce(clearResult);

    const result = await sut.clearAll();

    expect(result).toEqual(clearResult);
    expect(appManagerClientMock.clearAppManager).toHaveBeenCalledTimes(1);
  });
});

describe("destroy", () => {
  test("should call destroy all instances", () => {
    const clearResult = mock<ClearAppManagerResult>();
    appManagerClientMock.clearAppManager.mockResolvedValueOnce(clearResult);

    sut.destroy();

    expect(appManagerClientMock.clearAppManager).toHaveBeenCalledTimes(1);
  });

  test("should remove app added subscription", () => {
    hostStoreMock.getAll.mockReturnValueOnce([]);
    const addAction = appManagerClientMock.onProvisioned.mock.calls[0][0];

    sut.destroy();

    expect(appManagerClientMock.offProvisioned).toHaveBeenCalledWith(addAction);
  });

  test("should remove app removed subscription", () => {
    hostStoreMock.getAll.mockReturnValueOnce([]);
    const addAction = appManagerClientMock.onDestroyed.mock.calls[0][0];

    sut.destroy();

    expect(appManagerClientMock.offDestroyed).toHaveBeenCalledWith(addAction);
  });

  test("should remove app focus relay", () => {
    hostStoreMock.getAll.mockReturnValueOnce([]);

    sut.destroy();

    expect(appFocusRelayMock.destroy).toHaveBeenCalledTimes(1);
  });
});

describe("getAppCatalog", () => {
  test("should call workspaceClient.getAppCatalog and return the result", async () => {
    const appCatalog = [mock<AppConfig>(), mock<AppConfig>()];
    appManagerClientMock.getAppCatalog.mockResolvedValueOnce(appCatalog);

    const result = await sut.getAppCatalog();

    expect(result).toEqual(appCatalog);
    expect(appManagerClientMock.getAppCatalog).toHaveBeenCalledTimes(1);
  });
});

describe("getAppConfig", () => {
  test("should call workspaceClient.getAppConfig with arnOrName and return the result", async () => {
    const arnOrName = "test-arn-or-name";
    const appConfig = mock<AppConfig>();
    appManagerClientMock.getAppConfig.mockResolvedValueOnce(appConfig);

    const result = await sut.getAppConfig(arnOrName);

    expect(result).toEqual(appConfig);
    expect(appManagerClientMock.getAppConfig).toHaveBeenCalledWith(arnOrName);
    expect(appManagerClientMock.getAppConfig).toHaveBeenCalledTimes(1);
  });
});

describe("destroyInstance", () => {
  test("should destroy instance", async () => {
    const appInstanceId = "app-instance-id";
    appManagerClientMock.destroyInstance.mockResolvedValueOnce();

    await sut.destroyInstance(appInstanceId);

    expect(appManagerClientMock.destroyInstance).toHaveBeenCalledWith(appInstanceId);
  });
});

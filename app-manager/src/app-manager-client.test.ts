import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { AppConfig } from "@amazon-connect/workspace-types";
import { mock } from "jest-mock-extended";

import { AppInstanceData } from "./app";
import { AppManagerClient } from "./app-manager-client";
import { AppLaunchOptions } from "./manager";
import {
  AppInstanceRoutes,
  AppManagerRoutes,
  AppRoutes,
  WorkspaceRoutes,
} from "./routes";
import { AppStateTopicKey } from "./topic-keys";
import { ClearAppManagerResult } from "./types";
import { workspaceNamespace } from "./workspace-namespace";

jest.mock("@amazon-connect/core/lib/request/no-result-error");
jest.mock("@amazon-connect/core/lib/sdk-version", () => ({
  sdkVersion: "1.0.1",
}));

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});
let sut: AppManagerClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AppManagerClient({
    context: moduleContextMock,
  });
});

describe("constructor", () => {
  test("should set correct namespace", () => {
    expect(sut["namespace"]).toEqual(workspaceNamespace);
  });
});

describe("registerWorkspaceConnection", () => {
  test("should register proxy with plugins", async () => {
    const plugins = ["test-plugin"];

    await sut.registerWorkspaceConnection(plugins);

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      WorkspaceRoutes.registerConnection,
      {
        sdkVersion: "1.0.1",
        plugins,
      },
    );
  });

  test("should register proxy without plugins", async () => {
    await sut.registerWorkspaceConnection();

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      WorkspaceRoutes.registerConnection,
      {
        sdkVersion: "1.0.1",
        plugins: undefined,
      },
    );
  });
});

describe("getAppCatalog", () => {
  test("should get list of apps", async () => {
    const apps = [mock<AppConfig>(), mock<AppConfig>()];
    const expectedAppsResponse: { applications: AppConfig[] } = {
      applications: apps,
    };
    moduleProxyMock.request.mockResolvedValueOnce(expectedAppsResponse);

    const results = await sut.getAppCatalog();

    expect(results).toEqual(apps);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(AppRoutes.getCatalog);
  });

  test("should reject when expected", async () => {
    const testError = new Error("test error");
    moduleProxyMock.request.mockRejectedValueOnce(testError);
    try {
      await sut.getAppCatalog();
    } catch (err) {
      expect(err).toEqual(testError);
    }
  });
});

describe("getAppConfig", () => {
  test("should get an application's configuration", async () => {
    const appArn = "some-arn";
    const appConfig = mock<AppConfig>();
    moduleProxyMock.request.mockResolvedValueOnce(appConfig);

    const result = await sut.getAppConfig(appArn);

    expect(result).toEqual(appConfig);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(AppRoutes.getConfig, {
      key: appArn,
    });
  });

  test("should reject when expected", async () => {
    const testError = new Error("test error");
    moduleProxyMock.request.mockRejectedValueOnce(testError);
    try {
      await sut.getAppConfig("some-arn");
    } catch (err) {
      expect(err).toEqual(testError);
    }
  });
});

describe("launchApp", () => {
  test("should launch app with options", async () => {
    const arnOrName = "test-arn";
    const options = mock<AppLaunchOptions>();
    const instanceData = mock<AppInstanceData>();
    moduleProxyMock.request.mockResolvedValueOnce(instanceData);

    const result = await sut.launchApp(arnOrName, options);

    expect(result).toEqual(instanceData);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppInstanceRoutes.launch,
      {
        arnOrName,
        options: options,
      },
    );
  });

  test("should launch app without options", async () => {
    const arnOrName = "test-arn";
    const instanceData = mock<AppInstanceData>();
    moduleProxyMock.request.mockResolvedValueOnce(instanceData);

    const result = await sut.launchApp(arnOrName);

    expect(result).toEqual(instanceData);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppInstanceRoutes.launch,
      {
        arnOrName,
        options: {},
      },
    );
  });
});

describe("destroyInstance", () => {
  test("should destroy instance", async () => {
    const appInstanceId = "app-instance-id";
    moduleProxyMock.request.mockResolvedValueOnce();

    await sut.destroyInstance(appInstanceId);

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppInstanceRoutes.destroy,
      {
        appInstanceId,
      },
    );
  });
});

describe("destroyAllInstances", () => {
  test("should destroy all instances", async () => {
    const destroyResult = mock<{ appInstanceIds: string[] }>();
    moduleProxyMock.request.mockResolvedValueOnce(destroyResult);

    const result = await sut.destroyAllInstances();

    expect(result).toEqual(destroyResult);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppInstanceRoutes.destroyAll,
    );
  });
});

describe("clearAppManager", () => {
  test("should clear all instances", async () => {
    const clearResult = mock<ClearAppManagerResult>();
    moduleProxyMock.request.mockResolvedValueOnce(clearResult);

    const result = await sut.clearAppManager();

    expect(result).toEqual(clearResult);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppManagerRoutes.clear,
    );
  });
});

describe("onStateChanged", () => {
  test("should subscribe to state change", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.onStateChanged(handler, appInstanceId);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.StateChanged, parameter: appInstanceId },
      handler,
    );
  });
});

describe("offStateChanged", () => {
  test("should unsubscribe to state change", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.offStateChanged(handler, appInstanceId);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.StateChanged, parameter: appInstanceId },
      handler,
    );
  });
});

describe("onProvisioned", () => {
  test("should subscribe to provisioned", () => {
    const handler = jest.fn();

    sut.onProvisioned(handler);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Provisioned },
      handler,
    );
  });
});

describe("offProvisioned", () => {
  test("should unsubscribe to provisioned", () => {
    const handler = jest.fn();

    sut.offProvisioned(handler);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Provisioned },
      handler,
    );
  });
});

describe("onRunning", () => {
  test("should subscribe to running", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.onRunning(handler, appInstanceId);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Running, parameter: appInstanceId },
      handler,
    );
  });
});

describe("offRunning", () => {
  test("should unsubscribe to running", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.offRunning(handler, appInstanceId);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Running, parameter: appInstanceId },
      handler,
    );
  });
});

describe("onStopped", () => {
  test("should subscribe to stopped", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.onStopped(handler, appInstanceId);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Stopped, parameter: appInstanceId },
      handler,
    );
  });
});

describe("offStopped", () => {
  test("should unsubscribe to stopped", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.offStopped(handler, appInstanceId);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Stopped, parameter: appInstanceId },
      handler,
    );
  });
});

describe("onRestarting", () => {
  test("should subscribe to restarting", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.onRestarting(handler, appInstanceId);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Restarting, parameter: appInstanceId },
      handler,
    );
  });
});

describe("offRestarting", () => {
  test("should unsubscribe to restarting", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.offRestarting(handler, appInstanceId);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Restarting, parameter: appInstanceId },
      handler,
    );
  });
});

describe("onDestroying", () => {
  test("should subscribe to destroyed", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.onDestroying(handler, appInstanceId);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Destroying, parameter: appInstanceId },
      handler,
    );
  });
});
describe("offDestroying", () => {
  test("should unsubscribe to destroyed", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.offDestroying(handler, appInstanceId);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Destroying, parameter: appInstanceId },
      handler,
    );
  });
});

describe("onDestroyed", () => {
  test("should subscribe to destroyed", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.onDestroyed(handler, appInstanceId);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Destroyed, parameter: appInstanceId },
      handler,
    );
  });
});

describe("offDestroyed", () => {
  test("should unsubscribe to destroyed", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.offDestroyed(handler, appInstanceId);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Destroyed, parameter: appInstanceId },
      handler,
    );
  });
});

describe("onError", () => {
  test("should subscribe to error", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.onError(handler, appInstanceId);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Error, parameter: appInstanceId },
      handler,
    );
  });
});

describe("offError", () => {
  test("should unsubscribe to error", () => {
    const appInstanceId = "app-instance-id";
    const handler = jest.fn();

    sut.offError(handler, appInstanceId);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: AppStateTopicKey.Error, parameter: appInstanceId },
      handler,
    );
  });
});

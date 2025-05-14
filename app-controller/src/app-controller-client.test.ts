/* eslint-disable @typescript-eslint/unbound-method */
import { deepClone, ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { AppConfig } from "@amazon-connect/workspace-types";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppControllerClient } from "./app-controller-client";
import { AppInfo } from "./app-info";
import { AppLaunchOptions } from "./launch";
import { AppControllerRoutes } from "./routes";
import { AppFocusResult } from "./types";
import { workspaceNamespace } from "./workspace-namespace";

jest.mock("@amazon-connect/core/lib/utility/deep-clone");

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});
let sut: AppControllerClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AppControllerClient({
    context: moduleContextMock,
  });
});

describe("constructor", () => {
  test("should set correct namespace", () => {
    expect(sut["namespace"]).toEqual(workspaceNamespace);
  });
});

describe("getAppCatalog", () => {
  test("should get list of apps", async () => {
    const apps = [mock<AppConfig>(), mock<AppConfig>()];
    const expectedAppsResponse = { applications: apps };
    moduleProxyMock.request.mockResolvedValueOnce(expectedAppsResponse);

    const results = await sut.getAppCatalog();

    expect(results).toEqual(apps);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.getCatalog,
    );
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
    const appArn = "test-arn";
    const appConfig = mock<AppConfig>();
    moduleProxyMock.request.mockResolvedValueOnce(appConfig);

    const result = await sut.getAppConfig(appArn);

    expect(result).toEqual(appConfig);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.getConfig,
      {
        key: appArn,
      },
    );
  });
});

describe("launchApp", () => {
  test("should launch app with default options", async () => {
    const name = "test-app";
    const appInfo = mock<AppInfo>();
    moduleProxyMock.request.mockResolvedValueOnce(appInfo);

    const result = await sut.launchApp(name);

    expect(result).toEqual(appInfo);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.launchApp,
      { name, options: {} },
    );
    expect(deepClone).not.toHaveBeenCalled();
  });

  test("should launch app with provided options without parameters", async () => {
    const name = "test-app";
    const options: AppLaunchOptions = {
      launchKey: "my-key",
    };
    const appInfo = mock<AppInfo>();
    moduleProxyMock.request.mockResolvedValueOnce(appInfo);

    const result = await sut.launchApp(name, options);

    expect(result).toEqual(appInfo);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.launchApp,
      { name, options },
    );
    expect(deepClone).not.toHaveBeenCalled();
  });

  test("should deep clone parameters when provided in options", async () => {
    const name = "test-app";
    const parameters = { key: "value", nested: { data: "test" } };
    const options = mock<AppLaunchOptions>({
      parameters,
    });
    const appInfo = mock<AppInfo>();
    const clonedParameters = { ...parameters, isCloned: true };
    mocked(deepClone).mockReturnValueOnce(clonedParameters);
    moduleProxyMock.request.mockResolvedValueOnce(appInfo);

    const result = await sut.launchApp(name, options);

    expect(result).toEqual(appInfo);
    expect(deepClone).toHaveBeenCalledWith(parameters);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.launchApp,
      {
        name,
        options: {
          ...options,
          parameters: clonedParameters,
        },
      },
    );
  });
});

describe("getApp", () => {
  test("should get app info by instance id", async () => {
    const instanceId = "test-instance";
    const appInfo = mock<AppInfo>();
    moduleProxyMock.request.mockResolvedValueOnce(appInfo);

    const result = await sut.getApp(instanceId);

    expect(result).toEqual(appInfo);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.getApp,
      { instanceId },
    );
  });
});

describe("getApps", () => {
  test("should get apps for nearest ancestor app manager id", async () => {
    const apps = [mock<AppInfo>(), mock<AppInfo>()];
    moduleProxyMock.request.mockResolvedValueOnce({ apps });

    const result = await sut.getApps();

    expect(result).toEqual(apps);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.getApps,
      {},
    );
  });
});

describe("focusApp", () => {
  test("should focus app", async () => {
    const instanceId = "test-instance";
    const focusResult = mock<AppFocusResult>();
    moduleProxyMock.request.mockResolvedValueOnce(focusResult);

    const result = await sut.focusApp(instanceId);

    expect(result).toEqual(focusResult);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.focusApp,
      { instanceId },
    );
  });
});

describe("closeApp", () => {
  test("should close app", async () => {
    const instanceId = "test-instance";
    moduleProxyMock.request.mockResolvedValueOnce();

    await sut.closeApp(instanceId);

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppControllerRoutes.closeApp,
      { instanceId },
    );
  });
});

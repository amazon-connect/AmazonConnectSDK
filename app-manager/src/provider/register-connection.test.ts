import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppManagerClient } from "../app-manager-client";
import {
  addAppManagerPluginKey,
  registerConnection,
} from "./register-connection";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("../app-manager-client");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const AppManagerClientMock = AppManagerClient as MockedClass<
  typeof AppManagerClient
>;

const provider = mock<AmazonConnectProvider>();

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe("registerConnection", () => {
  describe("when no plugins are set", () => {
    test("should register the connection", async () => {
      await registerConnection(provider);

      expect(AppManagerClientMock).toHaveBeenCalledTimes(1);
      const [appManagerClientMock] = AppManagerClientMock.mock.instances;
      expect(
        appManagerClientMock.registerWorkspaceConnection,
      ).toHaveBeenCalledTimes(1);
      expect(
        appManagerClientMock.registerWorkspaceConnection,
      ).toHaveBeenCalledWith([]);
      expect(LoggerMock).toHaveBeenCalledTimes(1);
      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).toHaveBeenCalledWith(expect.any(String), {
        plugins: [],
      });
    });
  });

  describe("when plugins are set", () => {
    const plugin1 = "plugin-1";
    const plugin2 = "plugin-2";
    beforeEach(() => {
      addAppManagerPluginKey(plugin1);
      addAppManagerPluginKey(plugin2);
    });

    test("should register the connection", async () => {
      await registerConnection(provider);

      expect(AppManagerClientMock).toHaveBeenCalledTimes(1);
      const [appManagerClientMock] = AppManagerClientMock.mock.instances;
      expect(
        appManagerClientMock.registerWorkspaceConnection,
      ).toHaveBeenCalledTimes(1);
      expect(
        appManagerClientMock.registerWorkspaceConnection,
      ).toHaveBeenCalledWith(expect.arrayContaining([plugin1, plugin2]));
      expect(LoggerMock).toHaveBeenCalledTimes(1);
      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).toHaveBeenCalledWith(expect.any(String), {
        plugins: expect.arrayContaining([plugin1, plugin2]) as [],
      });
    });

    test("should log error when registration fails", async () => {
      const error = new Error("test-error");
      AppManagerClientMock.mockImplementationOnce(
        () =>
          ({
            registerWorkspaceConnection: jest.fn().mockRejectedValueOnce(error),
          }) as unknown as MockedObject<AppManagerClient>,
      );

      await registerConnection(provider);

      expect(AppManagerClientMock).toHaveBeenCalledTimes(1);
      const appManagerClientMock = AppManagerClientMock.mock.results[0]
        .value as AppManagerClient;
      expect(
        appManagerClientMock.registerWorkspaceConnection,
      ).toHaveBeenCalledTimes(1);
      expect(
        appManagerClientMock.registerWorkspaceConnection,
      ).toHaveBeenCalledWith(expect.arrayContaining([plugin1, plugin2]));
      expect(LoggerMock).toHaveBeenCalledTimes(1);
      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        error,
        plugins: expect.arrayContaining([plugin1, plugin2]) as [],
      });
    });
  });
});

import "./provider";

import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppManagerClient } from "../app-manager-client";
import { getProviderPlugins } from "./provider-plugins";
import { registerConnection } from "./register-connection";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("../app-manager-client");
jest.mock("./provider-plugins");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const AppManagerClientMock = AppManagerClient as MockedClass<
  typeof AppManagerClient
>;
const getProviderPluginsMock = jest.mocked(getProviderPlugins);

beforeEach(jest.resetAllMocks);

describe("registerConnection", () => {
  describe("when registration succeeds", () => {
    test("should create client with provider and call registerWorkspaceConnection with plugins from getProviderPlugins", async () => {
      const provider = mock<AmazonConnectProvider>();
      const plugins = ["plugin-1", "plugin-2"];
      getProviderPluginsMock.mockReturnValue(plugins);

      await registerConnection(provider);

      expect(AppManagerClientMock).toHaveBeenCalledTimes(1);
      expect(AppManagerClientMock).toHaveBeenCalledWith(provider);
      const [appManagerClientMock] = AppManagerClientMock.mock.instances;
      expect(
        appManagerClientMock.registerWorkspaceConnection,
      ).toHaveBeenCalledTimes(1);
      expect(
        appManagerClientMock.registerWorkspaceConnection,
      ).toHaveBeenCalledWith(plugins);
    });

    test("should log info on success", async () => {
      const provider = mock<AmazonConnectProvider>();
      const plugins = ["plugin-1"];
      getProviderPluginsMock.mockReturnValue(plugins);

      await registerConnection(provider);

      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).toHaveBeenCalledWith(expect.any(String), {
        plugins,
      });
    });
  });

  describe("when registration fails", () => {
    test("should log error and not rethrow", async () => {
      const provider = mock<AmazonConnectProvider>();
      const plugins = ["plugin-1", "plugin-2"];
      const error = new Error("test-error");
      getProviderPluginsMock.mockReturnValue(plugins);
      AppManagerClientMock.mockImplementationOnce(
        () =>
          ({
            registerWorkspaceConnection: jest.fn().mockRejectedValueOnce(error),
          }) as unknown as MockedObject<AppManagerClient>,
      );

      await registerConnection(provider);

      const [loggerMock] = LoggerMock.mock.instances;
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        error,
        plugins,
      });
    });
  });
});

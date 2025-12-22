import "./index";

import { AmazonConnectProviderBase, Proxy } from "@amazon-connect/core";
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppManager } from "./manager";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("./provider/register-connection");
jest.mock("./manager/app-manager");

const AppManagerMock = AppManager as MockedClass<typeof AppManager>;

class TestProvider extends AmazonConnectProviderBase {
  constructor() {
    super({
      config: {},

      proxyFactory: () => mock<Proxy>(),
    });
  }
}

describe("when importing the library", () => {
  test("should extend the provider to include app manager", () => {
    const provider = new TestProvider();

    const result = provider.appManager;

    expect(result).toBeDefined();
    expect(AppManager).toHaveBeenCalledTimes(1);
    expect(AppManager).toHaveBeenCalledWith({ provider });
    const [appManager] = AppManagerMock.mock.instances;
    expect(result).toEqual(appManager);
  });
});

/* eslint-disable @typescript-eslint/no-unused-expressions */
import { AmazonConnectProviderBase, Proxy } from "@amazon-connect/core";
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppManager } from "../manager";
import { AppManagerPlugin } from "./app-manager-plugin";
import { registerConnection } from "./register-connection";

jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("./register-connection");
jest.mock("../manager/app-manager");

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

const AppManagerMock = AppManager as MockedClass<typeof AppManager>;

let sut: TestProvider;

class TestProvider extends AmazonConnectProviderBase {
  constructor() {
    super({
      config: {},
      proxyFactory: () => mock<Proxy>(),
    });
  }
}

beforeAll(() => {
  AppManagerPlugin(AmazonConnectProviderBase.prototype);
});

beforeEach(() => {
  sut = new TestProvider();
});

describe("when calling the first time", () => {
  test("should provide a AppManager", () => {
    const result = sut.appManager;

    expect(result).toBeDefined();
    expect(AppManager).toHaveBeenCalledTimes(1);
    expect(AppManager).toHaveBeenCalledWith({ provider: sut });
    const [appManager] = AppManagerMock.mock.instances;
    expect(result).toEqual(appManager);
  });

  test("should register the connection", () => {
    sut.appManager;

    expect(registerConnection).toHaveBeenCalledTimes(1);
    expect(registerConnection).toHaveBeenCalledWith(sut);
  });
});

describe("when calling multiple times", () => {
  test("should return the same AppManager", () => {
    const first = sut.appManager;
    const second = sut.appManager;

    expect(first).toEqual(second);
    expect(AppManager).toHaveBeenCalledTimes(1);
  });

  test("should not register the connection multiple times", () => {
    sut.appManager;
    sut.appManager;

    expect(registerConnection).toHaveBeenCalledTimes(1);
  });
});

describe("when calling apply multiple times", () => {
  test("should not update teh property", () => {
    const first = sut.appManager;
    AppManagerPlugin(AmazonConnectProviderBase.prototype);

    const second = sut.appManager;

    expect(first).toEqual(second);
    expect(AppManager).toHaveBeenCalledTimes(1);
  });
});

describe("when attempting to override the app manager", () => {
  test("should allow item to be replaced without calling original", () => {
    const testError = new Error("App manager not available");

    Object.defineProperty(AmazonConnectProviderBase.prototype, "appManager", {
      get: function () {
        throw testError;
      },
      enumerable: true,
      configurable: true,
    });

    try {
      sut.appManager;
    } catch (error) {
      expect(error).toEqual(testError);
      expect(registerConnection).toHaveBeenCalledTimes(0);
    }

    expect.hasAssertions();
  });
});

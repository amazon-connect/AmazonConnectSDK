/* eslint-disable @typescript-eslint/no-unused-expressions */
import "./provider";

import {
  AmazonConnectProvider,
  AmazonConnectProviderBase,
  Proxy,
} from "@amazon-connect/core";
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppManager } from "../manager";
import { registerConnection } from "./register-connection";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("./register-connection");
jest.mock("../manager/app-manager");

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

const AppManagerMock = AppManager as MockedClass<typeof AppManager>;

let sut: AmazonConnectProvider;

class TestProvider extends AmazonConnectProviderBase {
  constructor() {
    super({
      config: {},
      proxyFactory: () => mock<Proxy>(),
    });
  }
}

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

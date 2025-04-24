/* eslint-disable @typescript-eslint/unbound-method */
import { mock } from "jest-mock-extended";

import { ConnectLogger } from "../logging";
import { ConnectMetricRecorder } from "../metric";
import { AmazonConnectProvider, getGlobalProvider } from "../provider";
import { Context } from "./";
import { ModuleContext } from "./module-context";

jest.mock("../logging");
jest.mock("../metric");
jest.mock("../provider");
jest.mock("./module-context");

beforeEach(() => {
  jest.resetAllMocks();
});

describe("getProxy", () => {
  test("should call getProvider().getProxy()", () => {
    const testProvider = mock<AmazonConnectProvider>();
    const testContext = new Context(testProvider);
    jest.spyOn(testProvider, "getProxy");
    jest.spyOn(testContext, "getProvider");

    testContext.getProxy();

    expect(testContext.getProvider).toHaveBeenCalled();
    expect(testProvider.getProxy).toHaveBeenCalled();
  });
});

describe("getProvider", () => {
  test("should call getGlobalProvider without this.provider defined", () => {
    const testContext = new Context();
    jest.spyOn(testContext, "getProvider");

    testContext.getProvider();

    expect(getGlobalProvider).toHaveBeenCalled();
  });
});

describe("getModuleContext", () => {
  test("should initialize ModuleContext object", () => {
    const testContext = new Context();

    testContext.getModuleContext("test");

    expect(ModuleContext).toHaveBeenCalled();
  });
});

describe("createLogger", () => {
  test("should initialize ConnectLogger object", () => {
    const testContext = new Context();

    testContext.createLogger("test");

    expect(ConnectLogger).toHaveBeenCalled();
  });
});

describe("createMetricRecorder", () => {
  test("should initialize ConnectMetricRecorder object if param is an object", () => {
    const testContext = new Context();

    testContext.createMetricRecorder({ namespace: "test" });

    expect(ConnectMetricRecorder).toHaveBeenCalled();
  });
  test("should initialize ConnectMetricRecorder object if param is a string", () => {
    const testContext = new Context();

    testContext.createMetricRecorder("test");

    expect(ConnectMetricRecorder).toHaveBeenCalled();
  });
});

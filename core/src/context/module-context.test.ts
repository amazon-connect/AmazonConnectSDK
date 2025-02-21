/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/unbound-method */
import * as proxy from "../proxy";
import { Context, ModuleContext } from "./";

beforeEach(() => {
  jest.resetAllMocks();
});

jest.mock("../logging");
jest.mock("./context");
jest.mock("../proxy");

describe("ModuleContext", () => {
  test("Multiple get proxy (in ModuleContext scope) calls Context.getProxy() only once", () => {
    const testContext = new Context();
    const testNameSpace = "test";
    const testModuleContext = new ModuleContext(testContext, testNameSpace);
    jest.spyOn(testContext, "getProxy");
    jest.spyOn(proxy, "createModuleProxy").mockImplementation(() => {
      return {} as unknown as proxy.ModuleProxy;
    });

    testModuleContext.proxy;
    testModuleContext.proxy;
    expect(testContext.getProxy).toHaveBeenCalledTimes(1);
    expect(proxy.createModuleProxy).toHaveBeenCalledTimes(1);
  });

  test("createLogger", () => {
    const testContext = new Context();
    const testNameSpace = "test";
    const testModuleContext = new ModuleContext(testContext, testNameSpace);
    jest.spyOn(testContext, "createLogger");

    testModuleContext.createLogger("test");
    expect(testContext.createLogger).toHaveBeenCalled();
  });

  test("createMetricRecorder", () => {
    const testContext = new Context();
    const testNameSpace = "test";
    const testModuleContext = new ModuleContext(testContext, testNameSpace);
    jest.spyOn(testContext, "createMetricRecorder");

    testModuleContext.createMetricRecorder({ namespace: "test" });
    expect(testContext.createMetricRecorder).toHaveBeenCalled();
  });
});

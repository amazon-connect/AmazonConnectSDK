import { Context } from "./";
import { ConnectLogger } from "../logging";
import {
  AmazonConnectProvider,
  AmazonConnectProviderParams,
  getGlobalProvider,
} from "../provider";
import { AmazonConnectConfig } from "../amazon-connect-config";
import { ModuleContext } from "./module-context";

jest.mock("../logging");
jest.mock("../provider");
jest.mock("./module-context");

beforeEach(() => {
  jest.resetAllMocks();
});

describe("getProxy", () => {
  test("should call getProvider().getProxy()", () => {
    const testProvider = new AmazonConnectProvider(
      {} as unknown as AmazonConnectProviderParams<AmazonConnectConfig>
    );
    const testContext = new Context(testProvider);
    jest.spyOn(testProvider, "getProxy");
    jest.spyOn(testContext, "getProvider");

    testContext.getProxy();

    expect(testContext.getProvider).toHaveBeenCalled();
    expect(testProvider.getProxy).toHaveBeenCalled();
  });
});

describe("getProvider", () => {
  test("should call getGlobaltProvider without this.provider defined", () => {
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

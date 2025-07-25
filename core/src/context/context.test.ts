/* eslint-disable @typescript-eslint/unbound-method */
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectProvider, getGlobalProvider } from "../provider";
import { Context } from "./";
import { ModuleContext } from "./module-context";

jest.mock("../provider/global-provider");
jest.mock("./module-context");

beforeEach(() => {
  jest.resetAllMocks();
});

describe("getProvider", () => {
  test("should return local provider", () => {
    const provider = mock<AmazonConnectProvider>();
    const sut = new Context(provider);

    const result = sut.getProvider();

    expect(result).toEqual(provider);
    expect(getGlobalProvider).not.toHaveBeenCalled();
  });

  test("should call getGlobalProvider without this.provider defined", () => {
    const provider = mock<AmazonConnectProvider>();
    const sut = new Context();
    mocked(getGlobalProvider).mockReturnValueOnce(provider);

    const result = sut.getProvider();

    expect(result).toEqual(provider);
    expect(getGlobalProvider).toHaveBeenCalled();
  });
});

describe("getModuleContext", () => {
  test("should initialize ModuleContext", () => {
    const testNamespace = "testNamespace";
    const sut = new Context();

    const result = sut.getModuleContext(testNamespace);

    expect(result).toEqual(mocked(ModuleContext).mock.instances[0]);
    expect(ModuleContext).toHaveBeenCalledTimes(1);
    expect(ModuleContext).toHaveBeenCalledWith(sut, testNamespace);
  });
});

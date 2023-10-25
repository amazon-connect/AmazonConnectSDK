/* eslint-disable @typescript-eslint/unbound-method */
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { Context, ModuleContext } from "../context";
import { AmazonConnectProvider } from "../provider";
import { ConnectClient } from "./connect-client";
import { ConnectClientConfig } from "./connect-client-config";

jest.mock("../context/context");

const ContextMock = Context as MockedClass<typeof Context>;

const testClientNamespace = "test-client-namespace";

class TestClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(testClientNamespace, config);
  }

  get moduleContext(): ModuleContext {
    return this.context;
  }

  get moduleNamespace(): AmazonConnectNamespace {
    return this.namespace;
  }
}

beforeEach(jest.resetAllMocks);

describe("when instantiating a ConnectClient", () => {
  test("should create client when not including a config", () => {
    const moduleContextMock = mock<ModuleContext>();
    ContextMock.prototype.getModuleContext.mockReturnValue(moduleContextMock);

    const sut = new TestClient();

    expect(ContextMock).toBeCalledWith(undefined);
    expect(ContextMock.mock.instances[0].getModuleContext).toBeCalledWith(
      testClientNamespace,
    );
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });

  test("should create client when not including a context or provider in config", () => {
    const moduleContextMock = mock<ModuleContext>();
    const config: ConnectClientConfig = {};
    ContextMock.prototype.getModuleContext.mockReturnValue(moduleContextMock);

    const sut = new TestClient(config);

    expect(ContextMock).toBeCalledWith(undefined);
    expect(ContextMock.mock.instances[0].getModuleContext).toBeCalledWith(
      testClientNamespace,
    );
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });

  test("should create client when including a provider without a context", () => {
    const moduleContextMock = mock<ModuleContext>();
    const provider = mock<AmazonConnectProvider>();
    const config: ConnectClientConfig = { provider };
    ContextMock.prototype.getModuleContext.mockReturnValue(moduleContextMock);

    const sut = new TestClient(config);

    expect(ContextMock).toBeCalledWith(provider);
    expect(ContextMock.mock.instances[0].getModuleContext).toBeCalledWith(
      testClientNamespace,
    );
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });

  test("should create client when setting a context", () => {
    const moduleContextMock = mock<ModuleContext>();
    const config: ConnectClientConfig = { context: moduleContextMock };

    const sut = new TestClient(config);

    expect(ContextMock).not.toBeCalled();
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });
});

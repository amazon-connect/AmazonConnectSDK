/* eslint-disable @typescript-eslint/unbound-method */
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { ModuleContext } from "../context";
import { AmazonConnectProvider } from "../provider";
import {
  ConnectClient,
  ConnectClientWithOptionalConfig,
} from "./connect-client";
import {
  ConnectClientConfig,
  ConnectClientConfigOptional,
} from "./connect-client-config";
import { getModuleContext } from "./get-module-context";

jest.mock("./get-module-context");

const getModuleContextMock = mocked(getModuleContext);

const testClientNamespace = "test-client-namespace";

class TestClient extends ConnectClient {
  constructor(config: ConnectClientConfig) {
    super(testClientNamespace, config);
  }

  get moduleContext(): ModuleContext {
    return this.context;
  }

  get moduleNamespace(): AmazonConnectNamespace {
    return this.namespace;
  }
}

class TestClientWithOptionalConfig extends ConnectClientWithOptionalConfig {
  constructor(config?: ConnectClientConfigOptional) {
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
  test("should create client with provider config", () => {
    const moduleContextMock = mock<ModuleContext>();
    const provider = mock<AmazonConnectProvider>();
    getModuleContextMock.mockReturnValue(moduleContextMock);

    const sut = new TestClient(provider);

    expect(getModuleContextMock).toHaveBeenCalledWith({
      namespace: testClientNamespace,
      config: provider,
    });
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });

  test("should create client with provider in config object", () => {
    const moduleContextMock = mock<ModuleContext>();
    const provider = mock<AmazonConnectProvider>();
    const config: ConnectClientConfig = { provider };
    getModuleContextMock.mockReturnValue(moduleContextMock);

    const sut = new TestClient(config);

    expect(getModuleContextMock).toHaveBeenCalledWith({
      namespace: testClientNamespace,
      config,
    });
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });

  test("should create client when setting a context", () => {
    const moduleContextMock = mock<ModuleContext>();
    const config: ConnectClientConfig = { context: moduleContextMock };
    getModuleContextMock.mockReturnValue(moduleContextMock);

    const sut = new TestClient(config);

    expect(getModuleContextMock).toHaveBeenCalledWith({
      namespace: testClientNamespace,
      config,
    });
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });
});

describe("when instantiating a ConnectClientWithOptionalConfig", () => {
  test("should create client with no config", () => {
    const moduleContextMock = mock<ModuleContext>();
    getModuleContextMock.mockReturnValue(moduleContextMock);

    const sut = new TestClientWithOptionalConfig();

    expect(getModuleContextMock).toHaveBeenCalledWith({
      namespace: testClientNamespace,
      config: undefined,
    });
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });

  test("should create client with provider config", () => {
    const moduleContextMock = mock<ModuleContext>();
    const provider = mock<AmazonConnectProvider>();
    getModuleContextMock.mockReturnValue(moduleContextMock);

    const sut = new TestClientWithOptionalConfig(provider);

    expect(getModuleContextMock).toHaveBeenCalledWith({
      namespace: testClientNamespace,
      config: provider,
    });
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });

  test("should create client with provider in config object", () => {
    const moduleContextMock = mock<ModuleContext>();
    const provider = mock<AmazonConnectProvider>();
    const config: ConnectClientConfigOptional = { provider };
    getModuleContextMock.mockReturnValue(moduleContextMock);

    const sut = new TestClientWithOptionalConfig(config);

    expect(getModuleContextMock).toHaveBeenCalledWith({
      namespace: testClientNamespace,
      config,
    });
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });

  test("should create client when setting a context", () => {
    const moduleContextMock = mock<ModuleContext>();
    const config: ConnectClientConfigOptional = { context: moduleContextMock };
    getModuleContextMock.mockReturnValue(moduleContextMock);

    const sut = new TestClientWithOptionalConfig(config);

    expect(getModuleContextMock).toHaveBeenCalledWith({
      namespace: testClientNamespace,
      config,
    });
    expect(sut.moduleContext).toEqual(moduleContextMock);
    expect(sut.moduleNamespace).toEqual(testClientNamespace);
  });
});

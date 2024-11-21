/* eslint-disable @typescript-eslint/unbound-method */
import { generateUUID } from "@amazon-connect/core";
import {
  getGlobalProvider,
  setGlobalProvider,
} from "@amazon-connect/core/lib/provider/global-provider";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectStreamsSite } from "./amazon-connect-streams-site";
import { AmazonConnectStreamsSiteConfig } from "./amazon-connect-streams-site-config";
import { StreamsSiteProxy } from "./streams-site-proxy";

jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("@amazon-connect/core/lib/provider/global-provider");
jest.mock("./streams-site-proxy");

const testProviderId = "testProviderId";
const config = mock<AmazonConnectStreamsSiteConfig>();

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  mocked(generateUUID).mockReturnValueOnce(testProviderId);
  mocked(setGlobalProvider).mockImplementation(() => {});
});

afterEach(() => {
  AmazonConnectStreamsSite["isInitialized"] = false;
});

describe("init", () => {
  let result: {
    provider: AmazonConnectStreamsSite;
  };

  beforeEach(() => {
    result = AmazonConnectStreamsSite.init(config);
  });

  test("should return AmazonConnectStreamsSite as provider", () => {
    expect(result.provider).toBeInstanceOf(AmazonConnectStreamsSite);
  });

  test("should set the configuration", () => {
    const resultConfig = result.provider.config;

    expect(resultConfig).toEqual({ ...config });
  });

  test("should set random provider id", () => {
    expect(result.provider.id).toEqual(testProviderId);
  });

  test("should set as global provider", () => {
    expect(setGlobalProvider).toBeCalledWith(result.provider);
  });

  test("should create a StreamsSiteProxy", () => {
    expect(StreamsSiteProxy).toBeCalledTimes(1);
    const [proxyInstance] = mocked(StreamsSiteProxy).mock.instances;
    expect(StreamsSiteProxy).toBeCalledWith(result.provider);
    expect(result.provider.getProxy()).toBe(proxyInstance);
  });

  test("should be initialized", () => {
    expect(AmazonConnectStreamsSite["isInitialized"]).toBeTruthy();
  });
});

describe("default", () => {
  test("should return value from global provider", () => {
    const { provider } = AmazonConnectStreamsSite.init(config);
    mocked(getGlobalProvider).mockReturnValue(provider);

    const result = AmazonConnectStreamsSite.default;

    expect(result).toEqual(provider);
  });
});

describe("setCCPIframe", () => {
  test("should set the iframe on for the proxy", () => {
    const { provider: sut } = AmazonConnectStreamsSite.init(config);
    const iframe = mock<HTMLIFrameElement>();

    sut.setCCPIframe(iframe);

    expect(StreamsSiteProxy).toBeCalledTimes(1);
    const [proxy] = mocked(StreamsSiteProxy).mock.instances;
    expect(proxy.setCCPIframe).toBeCalledWith(iframe);
  });
});

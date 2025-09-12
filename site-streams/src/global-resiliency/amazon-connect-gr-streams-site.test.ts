/* eslint-disable @typescript-eslint/unbound-method */
import { generateUUID } from "@amazon-connect/core";
import {
  getGlobalProvider,
  setGlobalProvider,
} from "@amazon-connect/core/lib/provider/global-provider";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectGRStreamsSite } from "./amazon-connect-gr-streams-site";
import { AmazonConnectGRStreamsSiteConfig } from "./amazon-connect-gr-streams-site-config";
import { GlobalResiliencyProxy } from "./global-resiliency-proxy";
import {
  GlobalResiliencyRegion,
  GlobalResiliencyRegionIframe,
} from "./global-resiliency-region";

jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("@amazon-connect/core/lib/provider/global-provider");
jest.mock("./global-resiliency-proxy");

const testProviderId = "testProviderId";
const config = mock<AmazonConnectGRStreamsSiteConfig>({
  primaryInstanceUrl: "https://primary.connect.aws",
  secondaryInstanceUrl: "https://secondary.connect.aws",
});

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  mocked(generateUUID).mockReturnValueOnce(testProviderId);
  mocked(setGlobalProvider).mockImplementation(() => {});
});

afterEach(() => {
  AmazonConnectGRStreamsSite["isInitialized"] = false;
});

describe("AmazonConnectGRStreamsSite", () => {
  describe("init", () => {
    let result: {
      provider: AmazonConnectGRStreamsSite;
    };

    beforeEach(() => {
      result = AmazonConnectGRStreamsSite.init(config);
    });

    test("should return AmazonConnectGRStreamsSite as provider", () => {
      expect(result.provider).toBeInstanceOf(AmazonConnectGRStreamsSite);
    });

    test("should set the configuration", () => {
      const resultConfig = result.provider.config;

      expect(resultConfig).toEqual({ ...config });
    });

    test("should set random provider id", () => {
      expect(result.provider.id).toEqual(testProviderId);
    });

    test("should set as global provider", () => {
      expect(setGlobalProvider).toHaveBeenCalledWith(result.provider);
    });

    test("should create a GlobalResiliencyProxy", () => {
      expect(GlobalResiliencyProxy).toHaveBeenCalledTimes(1);
      const [proxyInstance] = mocked(GlobalResiliencyProxy).mock.instances;
      expect(GlobalResiliencyProxy).toHaveBeenCalledWith(result.provider);
      expect(result.provider.getProxy()).toBe(proxyInstance);
    });

    test("should be initialized", () => {
      expect(AmazonConnectGRStreamsSite["isInitialized"]).toBeTruthy();
    });
  });

  describe("default", () => {
    test("should return value from global provider", () => {
      const { provider } = AmazonConnectGRStreamsSite.init(config);
      mocked(getGlobalProvider).mockReturnValue(provider);

      const result = AmazonConnectGRStreamsSite.default;

      expect(result).toEqual(provider);
    });

    test("should call getGlobalProvider with correct error message", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      AmazonConnectGRStreamsSite.default;

      expect(getGlobalProvider).toHaveBeenCalledWith(
        "AmazonConnectGRStreamsSite has not been initialized",
      );
    });
  });

  describe("setCCPIframe", () => {
    test("should set the iframe on the proxy for primary region", () => {
      const { provider: sut } = AmazonConnectGRStreamsSite.init(config);
      const iframe = {} as HTMLIFrameElement;
      const regionIframe: GlobalResiliencyRegionIframe = {
        iframe,
        region: GlobalResiliencyRegion.Primary,
      };

      sut.setCCPIframe(regionIframe);

      expect(GlobalResiliencyProxy).toHaveBeenCalledTimes(1);
      const [proxy] = mocked(GlobalResiliencyProxy).mock.instances;
      expect(proxy.setCCPIframe).toHaveBeenCalledWith(regionIframe);
    });

    test("should set the iframe on the proxy for secondary region", () => {
      const { provider: sut } = AmazonConnectGRStreamsSite.init(config);
      const iframe = {} as HTMLIFrameElement;
      const regionIframe: GlobalResiliencyRegionIframe = {
        iframe,
        region: GlobalResiliencyRegion.Secondary,
      };

      sut.setCCPIframe(regionIframe);

      expect(GlobalResiliencyProxy).toHaveBeenCalledTimes(1);
      const [proxy] = mocked(GlobalResiliencyProxy).mock.instances;
      expect(proxy.setCCPIframe).toHaveBeenCalledWith(regionIframe);
    });
  });

  describe("setActiveRegion", () => {
    test("should set active region to primary on the proxy", () => {
      const { provider: sut } = AmazonConnectGRStreamsSite.init(config);

      sut.setActiveRegion(GlobalResiliencyRegion.Primary);

      expect(GlobalResiliencyProxy).toHaveBeenCalledTimes(1);
      const [proxy] = mocked(GlobalResiliencyProxy).mock.instances;
      expect(proxy.setActiveRegion).toHaveBeenCalledWith(
        GlobalResiliencyRegion.Primary,
      );
    });

    test("should set active region to secondary on the proxy", () => {
      const { provider: sut } = AmazonConnectGRStreamsSite.init(config);

      sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

      expect(GlobalResiliencyProxy).toHaveBeenCalledTimes(1);
      const [proxy] = mocked(GlobalResiliencyProxy).mock.instances;
      expect(proxy.setActiveRegion).toHaveBeenCalledWith(
        GlobalResiliencyRegion.Secondary,
      );
    });
  });
});

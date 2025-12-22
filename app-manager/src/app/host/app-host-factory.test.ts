import { mock } from "jest-mock-extended";

import { createAppHost } from "./app-host-factory";
import { AppHostParams } from "./app-host-params";
import { IFrameAppHost } from "./iframe-app-host";

jest.mock("./iframe-app-host");

describe("createAppHost", () => {
  describe("when app host is iframe", () => {
    it("should create an IFrameAppHost", () => {
      const params = mock<AppHostParams>({ appConfig: { _type: "iframe" } });

      const appHost = createAppHost(params);

      expect(appHost).toBeInstanceOf(IFrameAppHost);
      expect(IFrameAppHost).toHaveBeenCalledTimes(1);
      expect(IFrameAppHost).toHaveBeenCalledWith(params);
    });
  });

  test("should throw for other type of AppHost", () => {
    const params = mock<AppHostParams>({
      appConfig: { _type: "other" as "iframe" },
    });

    try {
      createAppHost(params);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect.hasAssertions();
  });
});

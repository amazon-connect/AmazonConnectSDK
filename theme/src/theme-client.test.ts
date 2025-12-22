import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { themeNamespace } from "./namespace";
import { ThemeClient } from "./theme-client";
import { Theme } from "./types";

jest.resetAllMocks();

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: ThemeClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new ThemeClient({ context: moduleContextMock });
});

describe("ThemeClient", () => {
  describe("constructor", () => {
    test("should set correct namespace", () => {
      expect(sut["namespace"]).toEqual(themeNamespace);
    });
  });

  describe("getTheme", () => {
    test("should make proxy request correctly", async () => {
      const mockTheme = mock<Theme>({
        theme: { tokens: { colorBackgroundButtonPrimaryActive: "#000000" } },
      });
      moduleProxyMock.request.mockResolvedValue(mockTheme);

      const result = await sut.getTheme();

      expect(result).toBe(mockTheme);
      expect(moduleProxyMock.request).toHaveBeenCalledWith("getTheme");
    });
  });
});

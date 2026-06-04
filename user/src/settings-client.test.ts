import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { UserRoutes } from "./routes";
import { SettingsClient } from "./settings-client";
import { UserTopicKey } from "./topic-keys";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: SettingsClient;

beforeEach(jest.resetAllMocks);

describe("SettingsClient", () => {
  beforeEach(() => {
    sut = new SettingsClient({ context: moduleContextMock });
  });

  describe("Events", () => {
    test("onLanguageChanged adds subscription", () => {
      const handler = jest.fn();

      sut.onLanguageChanged(handler);

      expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
        { key: UserTopicKey.LanguageChanged },
        handler,
      );
    });

    test("offLanguageChanged removes subscription", () => {
      const handler = jest.fn();

      sut.offLanguageChanged(handler);

      expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
        { key: UserTopicKey.LanguageChanged },
        handler,
      );
    });

  });

  describe("Requests", () => {
    test("getLanguage returns result", async () => {
      const language = "en_US";
      moduleProxyMock.request.mockResolvedValueOnce({ language });

      const actualResult = await sut.getLanguage();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        UserRoutes.getLanguage,
      );
      expect(actualResult).toEqual(language);
    });

    test("setLanguage returns result", async () => {
      moduleProxyMock.request.mockResolvedValueOnce({ language: "en_US" });

      const actualResult = await sut.setLanguage("en_US");

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        UserRoutes.setLanguage,
        { language: "en_US" },
      );
      expect(actualResult).toEqual({ language: "en_US" });
    });

    test("setVisualMode sends request with visualMode", async () => {
      moduleProxyMock.request.mockResolvedValue({});

      await sut.setVisualMode("dark");

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        UserRoutes.setVisualMode,
        { visualMode: "dark" },
      );
    });

    test("onVisualModeChange adds subscription", () => {
      const handler = jest.fn();

      sut.onVisualModeChange(handler);

      expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
        { key: UserTopicKey.VisualModeChanged },
        handler,
      );
    });

    test("offVisualModeChange removes subscription", () => {
      const handler = jest.fn();

      sut.offVisualModeChange(handler);

      expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
        { key: UserTopicKey.VisualModeChanged },
        handler,
      );
    });
  });
});

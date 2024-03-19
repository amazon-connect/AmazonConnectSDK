/* eslint-disable @typescript-eslint/unbound-method */
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

      expect(moduleProxyMock.subscribe).toBeCalledWith(
        { key: UserTopicKey.LanguageChanged },
        handler,
      );
    });

    test("offLanguageChanged removes subscription", () => {
      const handler = jest.fn();

      sut.offLanguageChanged(handler);

      expect(moduleProxyMock.unsubscribe).toBeCalledWith(
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
  });
});

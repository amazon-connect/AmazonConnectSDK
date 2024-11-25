/* eslint-disable @typescript-eslint/unbound-method */
import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { MessageTemplateClient } from "./message-template-client";
import { MessageTemplateRoute } from "./routes";
import {
  MessageTemplateContent,
  MessageTemplateEnabledState,
  SearchMessageTemplatesParams,
  SearchMessageTemplatesResponse,
} from "./types";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: MessageTemplateClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new MessageTemplateClient({
    context: moduleContextMock,
  });
});

describe("MessageTemplateClient", () => {
  describe("searchMessageTemplates", () => {
    test("searchMessageTemplates returns message templates", async () => {
      const response: SearchMessageTemplatesResponse =
        mock<SearchMessageTemplatesResponse>();
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(response)),
      );
      const actualResult = await sut.searchMessageTemplates({
        channels: ["EMAIL"],
      });
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        MessageTemplateRoute.searchMessageTemplates,
        { request: { channels: ["EMAIL"] } },
      );
      expect(actualResult).toBe(response);
    });

    test("searchMessageTemplates with filter returns message templates", async () => {
      const request: SearchMessageTemplatesParams =
        mock<SearchMessageTemplatesParams>();
      const response: SearchMessageTemplatesResponse =
        mock<SearchMessageTemplatesResponse>();
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(response)),
      );
      const actualResult = await sut.searchMessageTemplates(request);
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        MessageTemplateRoute.searchMessageTemplates,
        { request },
      );
      expect(actualResult).toBe(response);
    });
  });

  describe("isEnabled", () => {
    test("isEnabled returns enabled state type", async () => {
      const mockResponse = mock<MessageTemplateEnabledState>();
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(mockResponse)),
      );
      const actualResult = await sut.isEnabled();
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        MessageTemplateRoute.isEnabled,
      );
      expect(actualResult).toBe(mockResponse);
    });
  });

  describe("getContent", () => {
    test("getContent returns message template content", async () => {
      const messageTemplateId: string = "testMessageTemplateId";
      const contactId: string = "testContactId";
      const response: MessageTemplateContent = mock<MessageTemplateContent>();
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(response)),
      );
      const actualResult = await sut.getContent(messageTemplateId, contactId);
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        MessageTemplateRoute.getContent,
        { messageTemplateId, contactId },
      );
      expect(actualResult).toBe(response);
    });
  });
});

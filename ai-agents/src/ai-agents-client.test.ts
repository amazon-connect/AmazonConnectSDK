import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { AIAgentsClient } from "./ai-agents-client";
import { AIAgentsRoute } from "./routes";
import { AIAgentsTopicKey } from "./topic-keys";
import {
  AIAgentSupportedResult,
  ContentResult,
  ListAIAgentMessagesResult,
  SendAIAgentMessageResult,
} from "./types";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let aiAgentsClient: AIAgentsClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  aiAgentsClient = new AIAgentsClient({
    context: moduleContextMock,
  });
});

describe("AIAgentsClient", () => {
  describe("Requests", () => {
    describe("isAIAgentSupported", () => {
      test("should make proxy request with correct route", async () => {
        const mockResult: AIAgentSupportedResult = { isSupported: true };
        moduleProxyMock.request.mockResolvedValue(mockResult);

        const result = await aiAgentsClient.isAIAgentSupported();

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          AIAgentsRoute.isAIAgentSupported,
        );
        expect(result).toEqual(mockResult);
      });
    });

    describe("sendAIAgentMessage", () => {
      test("should make proxy request with params", async () => {
        const params = { contactId: "contact-1", text: "hello" };
        const mockHandle: SendAIAgentMessageResult = {
          inputId: "input-1",
        };
        moduleProxyMock.request.mockResolvedValue(mockHandle);

        const result = await aiAgentsClient.sendAIAgentMessage(params);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          AIAgentsRoute.sendAIAgentMessage,
          params,
        );
        expect(result).toEqual(mockHandle);
      });

      test("should make proxy request with metadata", async () => {
        const params = {
          contactId: "contact-1",
          text: "hello",
          metadata: {
            RECOMMENDATION_TYPE: "DETECTED_INTENT" as const,
            INTENT_ID: "intent-1",
          },
        };
        const mockHandle: SendAIAgentMessageResult = {
          inputId: "input-1",
        };
        moduleProxyMock.request.mockResolvedValue(mockHandle);

        const result = await aiAgentsClient.sendAIAgentMessage(params);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          AIAgentsRoute.sendAIAgentMessage,
          params,
        );
        expect(result).toEqual(mockHandle);
      });
    });

    describe("listAIAgentMessages", () => {
      test("should make proxy request with params", async () => {
        const params = { contactId: "contact-1" };
        const mockResult: ListAIAgentMessagesResult = {
          contactId: "contact-1",
          messages: [],
        };
        moduleProxyMock.request.mockResolvedValue(mockResult);

        const result = await aiAgentsClient.listAIAgentMessages(params);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          AIAgentsRoute.listAIAgentMessages,
          params,
        );
        expect(result).toEqual(mockResult);
      });
    });

    describe("getKnowledgeContent", () => {
      test("should make proxy request with params", async () => {
        const params = {
          knowledgeBaseId: "kb-1",
          contentId: "content-1",
        };
        const mockResult: ContentResult = {
          contentId: "content-1",
          contentArn: "arn:aws:content-1",
          title: "Test Article",
          contentType: "text/html",
          body: "<p>content</p>",
        };
        moduleProxyMock.request.mockResolvedValue(mockResult);

        const result = await aiAgentsClient.getKnowledgeContent(params);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          AIAgentsRoute.getKnowledgeContent,
          params,
        );
        expect(result).toEqual(mockResult);
      });
    });
  });

  describe("Events", () => {
    const contactId = "test-contact-id";

    describe("AIAgentContactReady", () => {
      test("subscribes to event with handler and contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.onAIAgentContactReady(handler, contactId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentContactReady,
            parameter: contactId,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler and contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.offAIAgentContactReady(handler, contactId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentContactReady,
            parameter: contactId,
          },
          handler,
        );
      });
    });

    describe("AIAgentMessageReceived", () => {
      test("subscribes to event with handler and contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.onAIAgentMessageReceived(handler, contactId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentMessageReceived,
            parameter: contactId,
          },
          handler,
        );
      });

      test("subscribes to event with handler and without contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.onAIAgentMessageReceived(handler);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentMessageReceived,
            parameter: undefined,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler and contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.offAIAgentMessageReceived(handler, contactId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentMessageReceived,
            parameter: contactId,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler and without contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.offAIAgentMessageReceived(handler);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentMessageReceived,
            parameter: undefined,
          },
          handler,
        );
      });
    });

    describe("AIAgentMessageStatusChanged", () => {
      test("subscribes to event with handler and contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.onAIAgentMessageStatusChanged(handler, contactId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentMessageStatusChanged,
            parameter: contactId,
          },
          handler,
        );
      });

      test("subscribes to event with handler and without contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.onAIAgentMessageStatusChanged(handler);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentMessageStatusChanged,
            parameter: undefined,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler and contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.offAIAgentMessageStatusChanged(handler, contactId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentMessageStatusChanged,
            parameter: contactId,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler and without contactId", () => {
        const handler = jest.fn();

        aiAgentsClient.offAIAgentMessageStatusChanged(handler);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: AIAgentsTopicKey.AIAgentMessageStatusChanged,
            parameter: undefined,
          },
          handler,
        );
      });
    });
  });
});

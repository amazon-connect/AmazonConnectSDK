import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { aiAgentsNamespace } from "./namespace";
import { AIAgentsRoute } from "./routes";
import { AIAgentsTopicKey } from "./topic-keys";
import {
  AIAgentContactReadyHandler,
  AIAgentMessageHandler,
  AIAgentMessageStatusHandler,
  AIAgentSupportedResult,
  ContentResult,
  GetContentParams,
  ListAIAgentMessagesParams,
  ListAIAgentMessagesResult,
  SendAIAgentMessageParams,
  SendAIAgentMessageResult,
} from "./types";

/**
 * AIAgentsClient provides methods for interacting with AI Agents functionality.
 *
 * This client provides methods for retrieving recommendations, querying the assistant,
 * managing content, and submitting feedback through the Amazon Connect SDK.
 */
export class AIAgentsClient extends ConnectClient {
  /**
   * Creates a new AIAgentsClient instance with the specified configuration.
   *
   * @param config - The configuration for the client
   */
  constructor(config: ConnectClientConfig) {
    super(aiAgentsNamespace, config);
  }

  /**
   * Checks whether the Connect instance has an AI Agent configured.
   *
   * @returns Whether AI agent functionality is configured for this Connect instance
   */
  async isAIAgentSupported(): Promise<AIAgentSupportedResult> {
    return this.context.proxy.request(AIAgentsRoute.isAIAgentSupported);
  }

  /**
   * Subscribes a handler that fires when session and agentic state have been
   * resolved for a contact. Use to know when AI Agents features are available.
   *
   * @param handler - Callback fired when session + agentic state are ready
   * @param contactId - The contact to scope this handler to
   */
  onAIAgentContactReady(handler: AIAgentContactReadyHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: AIAgentsTopicKey.AIAgentContactReady, parameter: contactId },
      handler,
    );
  }

  /**
   * Removes a {@link onAIAgentContactReady} handler subscription.
   *
   * @param handler - Handler to remove
   * @param contactId - Contact scope for the handler
   */
  offAIAgentContactReady(handler: AIAgentContactReadyHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: AIAgentsTopicKey.AIAgentContactReady, parameter: contactId },
      handler,
    );
  }

  /**
   * Sends a message to the AI Agent.
   *
   * @param params - The message parameters
   * @returns A handle for correlating responses to this specific call
   */
  sendAIAgentMessage(params: SendAIAgentMessageParams): Promise<SendAIAgentMessageResult> {
    return this.context.proxy.request(
      AIAgentsRoute.sendAIAgentMessage,
      params,
    );
  }

  /**
   * Lists all AI Agent messages for a contact, ordered by sequence number.
   *
   * @param params - The list parameters including contactId
   * @returns The message history for the contact
   */
  listAIAgentMessages(params: ListAIAgentMessagesParams): Promise<ListAIAgentMessagesResult> {
    return this.context.proxy.request(
      AIAgentsRoute.listAIAgentMessages,
      params,
    );
  }

  /**
   * Retrieves the full content of a knowledge article, including a pre-signed
   * URL for rendering.
   *
   * @param params - The knowledge base and content identifiers
   * @returns The knowledge article content
   */
  getKnowledgeContent(params: GetContentParams): Promise<ContentResult> {
    return this.context.proxy.request(
      AIAgentsRoute.getKnowledgeContent,
      params,
    );
  }

  /**
   * Subscribes to the unified AI agents message stream.
   * Fires for all message types (USER_INPUT, RESPONSE_CHUNK, INTENT, PREDEFINED).
   *
   * @param handler - Callback fired on each new message
   * @param contactId - Optional contact to scope this subscription to
   */
  onAIAgentMessageReceived(
    handler: AIAgentMessageHandler,
    contactId?: string,
  ): void {
    this.context.proxy.subscribe(
      { key: AIAgentsTopicKey.AIAgentMessageReceived, parameter: contactId },
      handler,
    );
  }

  /**
   * Removes a {@link onAIAgentMessageReceived} handler subscription.
   *
   * @param handler - Handler to remove
   * @param contactId - Optional contact scope for the handler
   */
  offAIAgentMessageReceived(
    handler: AIAgentMessageHandler,
    contactId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      { key: AIAgentsTopicKey.AIAgentMessageReceived, parameter: contactId },
      handler,
    );
  }

  /**
   * Subscribes to status lifecycle transitions for AI agent messages.
   *
   * @param handler - Callback invoked on each status transition
   * @param contactId - Optional contact to scope this subscription to
   */
  onAIAgentMessageStatusChanged(
    handler: AIAgentMessageStatusHandler,
    contactId?: string,
  ): void {
    this.context.proxy.subscribe(
      { key: AIAgentsTopicKey.AIAgentMessageStatusChanged, parameter: contactId },
      handler,
    );
  }

  /**
   * Removes a {@link onAIAgentMessageStatusChanged} handler subscription.
   *
   * @param handler - Handler to remove
   * @param contactId - Optional contact scope for the handler
   */
  offAIAgentMessageStatusChanged(
    handler: AIAgentMessageStatusHandler,
    contactId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      { key: AIAgentsTopicKey.AIAgentMessageStatusChanged, parameter: contactId },
      handler,
    );
  }
}

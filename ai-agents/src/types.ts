import { SubscriptionHandler } from "@amazon-connect/core";

/**
 * Fires when the session and agentic state have been resolved for a contact.
 */
export type AIAgentContactReadyEvent = {
  contactId: string;
  /** True if an AI Agent with agentic capabilities is configured. */
  isAgenticEnabled: boolean;
};

/** Handler for {@link AIAgentContactReadyEvent}. */
export type AIAgentContactReadyHandler =
  SubscriptionHandler<AIAgentContactReadyEvent>;

/**
 * Result of {@link AIAgentsClient.isAIAgentSupported}.
 */
export type AIAgentSupportedResult = {
  /** True if AI Agent functionality is configured for the Connect instance. */
  isSupported: boolean;
};

/**
 * Specifies the kind of content a message carries.
 *
 * Inbound (human agent → LLM): `USER_INPUT`, `PREDEFINED`.
 * Outbound (LLM → human agent): `RESPONSE_CHUNK`, `INTENT`.
 */
export type AIAgentMessageType =
  | "RESPONSE_CHUNK"
  | "USER_INPUT"
  | "INTENT"
  | "PREDEFINED";

/** Statuses for inbound messages (USER_INPUT, PREDEFINED). */
export type AIAgentInboundStatus = "IN_FLIGHT" | "RECEIVED";

/** Statuses for outbound messages (RESPONSE_CHUNK, INTENT). */
export type AIAgentOutboundStatus = "SUCCESS" | "BLOCKED" | "FAILED";

/** Union of all message statuses. */
export type AIAgentMessageStatus =
  | AIAgentInboundStatus
  | AIAgentOutboundStatus;

/** Known reference types for citation sources. */
export type CitationReferenceType =
  | "WEB_CRAWLER"
  | "KNOWLEDGE_BASE"
  | "BEDROCK_KB_S3"
  | "BEDROCK_KB_WEB"
  | "BEDROCK_KB_CONFLUENCE"
  | "BEDROCK_KB_SALESFORCE"
  | "BEDROCK_KB_SHAREPOINT"
  | "BEDROCK_KB_KENDRA"
  | "BEDROCK_KB_CUSTOM_DOCUMENT"
  | "BEDROCK_KB_SQL";

/** A citation referencing source content within a response. */
export type Citation = {
  citationSpan: {
    beginOffsetInclusive: number;
    endOffsetExclusive: number;
  };
  referenceType: CitationReferenceType;
  contentId?: string;
  knowledgeBaseId?: string;
  sourceURL?: string;
  title?: string;
};

/** Unified message event carrying both content type and lifecycle status. */
export type AIAgentMessageEvent = {
  inputId: string;
  message: {
    type: AIAgentMessageType;
    status: AIAgentMessageStatus;
    response: {
      value: string;
      citations?: Citation[];
      isGuardrailBlocked?: boolean;
    };
    isFinalResponse: boolean;
  };
  contactId?: string;
};

/** Handler for {@link AIAgentMessageEvent}. */
export type AIAgentMessageHandler =
  SubscriptionHandler<AIAgentMessageEvent>;

/** Fired on status lifecycle transitions for UI state management. */
export type AIAgentMessageStatusEvent = {
  inputId: string;
  status: AIAgentMessageStatus;
  contactId?: string;
};

/** Handler for {@link AIAgentMessageStatusEvent}. */
export type AIAgentMessageStatusHandler =
  SubscriptionHandler<AIAgentMessageStatusEvent>;

/** Attribution metadata for {@link SendAIAgentMessageParams}. */
export type SendAIAgentMessageMetadata = {
  RECOMMENDATION_TYPE?: "DETECTED_INTENT" | "SUGGESTED_MESSAGE";
  INTENT_ID?: string;
};

/** Parameters for {@link AIAgentsClient.sendAIAgentMessage}. */
export type SendAIAgentMessageParams = {
  /** Contact identifier. */
  contactId?: string;
  /** The message or query text. */
  text: string;
  /** Attribution metadata indicating the origin of the user's action. */
  metadata?: SendAIAgentMessageMetadata;
};

/**
 * Handle returned by {@link AIAgentsClient.sendAIAgentMessage}.
 */
export interface SendAIAgentMessageResult {
  /** Unique ID assigned to this request for correlation. */
  inputId: string;
}

/** Parameters for {@link AIAgentsClient.listAIAgentMessages}. */
export type ListAIAgentMessagesParams = {
  contactId?: string;
};

/** Result of {@link AIAgentsClient.listAIAgentMessages}. */
export type ListAIAgentMessagesResult = {
  contactId: string;
  messages: AIAgentMessageEvent[];
};

/** Parameters for {@link AIAgentsClient.getKnowledgeContent}. */
export type GetContentParams = {
  /** The knowledge base ID or full knowledge base ARN. */
  knowledgeBaseId: string;
  /** The content ID or full content ARN. */
  contentId: string;
};

/** Known content media types for knowledge articles. */
export type KnowledgeContentType =
  | "text/plain"
  | "text/html"
  | "text/csv"
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/x.wisdom-json;source=salesforce"
  | "application/x.wisdom-json;source=servicenow"
  | "application/x.wisdom-json;source=zendesk";

/** Result of {@link AIAgentsClient.getKnowledgeContent}. */
export type ContentResult = {
  contentId: string;
  contentArn: string;
  title?: string;
  contentType?: KnowledgeContentType;
  /** Pre-signed URL, re-fetch if expired. */
  url?: string;
  /** Populated for text/plain and text/html. */
  body?: string;
};

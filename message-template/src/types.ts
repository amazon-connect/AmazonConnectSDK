export type MessageTemplateEnabledState =
  | {
      /**
       * False if message templates are not enabled or there are no message templates configured on the instance.
       */
      isEnabled: false;
    }
  | {
      /**
       * True if message templates are enabled and there are message templates configured on the instance.
       */
      isEnabled: true;

      /**
       * knowledgeBaseId will exist if isEnabled is true.
       */
      knowledgeBaseId: string;
    };

export type SearchMessageTemplatesParams = {
  /**
   * The channel(s) to return message templates for. If the list is empty, no message templates
   * will be returned.
   */
  channels: MessageTemplateChannel[];

  /**
   * Queries are used to filter the returned message templates by name or description. Leaving the
   * queries empty will return all message templates associated with the agent's routing profile.
   */
  queries?: MessageTemplateQueryField[];

  /**
   * Maximum number of message templates to return.
   */
  maxResults?: number;

  nextToken?: string;
};

export type MessageTemplateQueryField = {
  /**
   * The message templates will be filtered by the values matching the text in the name field
   * provided.
   */
  name: "name" | "description";

  values: string[];

  /**
   * The importance of the attribute field when calculating query result relevancy scores. The value
   * set for this parameter affects the ordering of search results.
   */
  priority?: "HIGH" | "MEDIUM" | "LOW";

  /**
   * Whether the query expects only exact matches on the attribute field values. The results of the
   * query will only include exact matches if this parameter is set to false.
   */
  allowFuzziness?: boolean;

  /**
   * Include all templates that contain the values or only templates that contain the values as the prefix.
   */
  operator: "CONTAINS" | "CONTAINS_AND_PREFIX";
};

/**
 * The supported channels to search message templates.
 */
export type MessageTemplateChannel = "EMAIL";

export type SearchMessageTemplatesResponse = {
  /**
   * List of message templates matching the search criteria specified in the request.
   */
  messageTemplates: MessageTemplate[];

  nextToken?: string;
};

export type MessageTemplate = {
  /**
   * The ARN of the message template. This contains the active version qualifier at the end
   * of the ARN. More information on versioning can be found here:
   * https://docs.aws.amazon.com/connect/latest/adminguide/about-version-message-templates.html.
   */
  messageTemplateArn: string;

  /**
   * The ID of the message template. This does NOT contain a qualifier with the version
   * of the message template.
   */
  messageTemplateId: string;

  /**
   * Name of the message template.
   */
  name: string;

  /**
   * Description of the message template.
   */
  description?: string;
};

export type MessageTemplateContent = {
  /**
   * Message subject populated in the template.
   */
  subject?: string;

  /**
   * Message body content populated in the template. This can include plainText or html or both.
   */
  body?: MessageTemplateBody;

  /**
   * Attachments populated in the template.
   */
  attachments?: MessageTemplateAttachment[];

  /**
   * List of attributes that were not automatically populated in the message template. If all attributes
   * were automatically populated, this list will be empty.
   */
  attributesNotInterpolated?: string[];
};

export type MessageTemplateBody = {
  /**
   * Plain text content of the message template as a string. It is possible for both the plain text and html
   * to be populated, or for only the plain text or html content to be populated.
   */
  plainText?: string;

  /**
   * HTML content of the message template as a string.
   */
  html?: string;
};

export type MessageTemplateAttachment = {
  /**
   * Name of the attachment.
   */
  fileName: string;

  /**
   * ID of the attachment.
   */
  fileId: string;

  /**
   * URL to download the attachment.
   */
  downloadUrl: string;
};

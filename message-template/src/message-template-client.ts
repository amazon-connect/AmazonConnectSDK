import {
  ConnectClientConfig,
  ConnectClientConfigDeprecated,
  ConnectClientConfigOptional,
  ConnectClientWithOptionalConfig,
} from "@amazon-connect/core";

import { messageTemplateNamespace } from "./message-template-namespace";
import { MessageTemplateRoute } from "./routes";
import {
  MessageTemplateContent,
  MessageTemplateEnabledState,
  SearchMessageTemplatesParams,
  SearchMessageTemplatesResponse,
} from "./types";

export class MessageTemplateClient extends ConnectClientWithOptionalConfig {
  /**
   * Creates a new MessageTemplateClient instance with the specified configuration.
   *
   * @param config - The configuration for the client. Can be provided as:
   *   - An AmazonConnectProvider instance directly: `new MessageTemplateClient(provider)`
   *   - An object with provider: `new MessageTemplateClient({ provider })`
   *
   * @example
   * ```typescript
   * // Recommended: Pass provider directly
   * const client = new MessageTemplateClient(provider);
   *
   * // Alternative: Pass as object
   * const client = new MessageTemplateClient({ provider });
   * ```
   */
  constructor(config: ConnectClientConfig);

  /**
   * @deprecated Calling MessageTemplateClient without AmazonConnectProvider is deprecated and will be removed in a future version.
   * Please provide an AmazonConnectProvider instance: `new MessageTemplateClient(provider)`
   */
  constructor(config?: ConnectClientConfigDeprecated);

  constructor(config: ConnectClientConfigOptional) {
    super(messageTemplateNamespace, config);
  }

  /**
   * Checks if message templates are enabled on the instance.
   *
   * @returns {MessageTemplateEnabledState} isEnabled, knowledgeBaseId is returned if isEnabled is true
   */
  isEnabled(): Promise<MessageTemplateEnabledState> {
    return this.context.proxy.request(MessageTemplateRoute.isEnabled);
  }

  /**
   * Gets the active message templates for the agent's routing profile, and the channel(s) specified,
   * filtered by the filter text, if provided. If no filter text is provided, all active message
   * templates for the agent's routing profile and the channel(s) specified are returned.
   *
   * @param {SearchMessageTemplatesParams} request channel(s) to return message templates for, optional
   * query to filter the message templates by name or description
   * @returns {SearchMessageTemplatesResponse} message templates matching the search criteria
   */
  searchMessageTemplates(
    request: SearchMessageTemplatesParams,
  ): Promise<SearchMessageTemplatesResponse> {
    return this.context.proxy.request(
      MessageTemplateRoute.searchMessageTemplates,
      { request },
    );
  }

  /**
   * Gets the content of a message template. This includes plaintext or html content of the body
   * of the message template as a string, the subject of the message template, and attachments if
   * they are configured on the message template.
   *
   * Attributes in the message template will be filled if they are system attributes, agent attributes,
   * or custom attributes set up in the contact flow. More information on the attributes can be found here:
   * https://docs.aws.amazon.com/connect/latest/adminguide/personalize-templates.html
   *
   * @param {string} messageTemplateId messageTemplateId or the messageTemplateArn.
   *
   * Passing in the messageTemplateArn returned by searchMessageTemplates is recommended here, since
   * this will get the content of the active version of the message template.
   *
   * Passing in the messageTemplateId will return the content of the latest version of the
   * message template. A qualifier can be appended to the messageTemplateId to get the content of a
   * different version of the message template.
   *
   * More information on qualifiers can be found here:
   * https://docs.aws.amazon.com/connect/latest/APIReference/API_amazon-q-connect_GetMessageTemplate.html
   *
   * More information on versioning can be found here:
   * https://docs.aws.amazon.com/connect/latest/adminguide/about-version-message-templates.html
   *
   * @param {string} contactId of the current contact to add the message template to, this is used
   * to populate attributes in the message template
   * @returns {MessageTemplateContent} content of the message template
   */
  getContent(
    messageTemplateId: string,
    contactId: string,
  ): Promise<MessageTemplateContent> {
    return this.context.proxy.request(MessageTemplateRoute.getContent, {
      messageTemplateId,
      contactId,
    });
  }
}

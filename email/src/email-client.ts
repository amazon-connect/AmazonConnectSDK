import {
  ConnectClientConfig,
  ConnectClientConfigDeprecated,
  ConnectClientConfigOptional,
  ConnectClientWithOptionalConfig,
  SubscriptionHandler,
} from "@amazon-connect/core";

import { emailNamespace } from "./email-namespace";
import { EmailRoute } from "./routes";
import { EmailContactEvents } from "./topic-keys";
import {
  CreateDraftEmailContact,
  DraftEmailContact,
  EmailContact,
  EmailContactId,
  EmailThreadContact,
  GetEmailThreadParams,
} from "./types";

export class EmailClient extends ConnectClientWithOptionalConfig {
  /**
   * Creates a new EmailClient instance with the specified configuration.
   *
   * @param config - The configuration for the client. Can be provided as:
   *   - An AmazonConnectProvider instance directly: `new EmailClient(provider)`
   *   - An object with provider: `new EmailClient({ provider })`
   *
   * @example
   * ```typescript
   * // Recommended: Pass provider directly
   * const client = new EmailClient(provider);
   *
   * // Alternative: Pass as object
   * const client = new EmailClient({ provider });
   * ```
   */
  constructor(config: ConnectClientConfig);

  /**
   * @deprecated Calling EmailClient without AmazonConnectProvider is deprecated and will be removed in a future version.
   * Please provide an AmazonConnectProvider instance: `new EmailClient(provider)`
   */
  constructor(config?: ConnectClientConfigDeprecated);

  constructor(config: ConnectClientConfigOptional) {
    super(emailNamespace, config);
  }

  /**
   * Get data for an email contact
   *
   * @param {string} request.contactId the email contact to get data for
   * @param {string} request.activeContactId the contact the agent is actively viewing
   * @returns {Promise<EmailContact>} a promise that resolves to the email contact data
   */
  getEmailData({
    contactId,
    activeContactId,
  }: {
    contactId: string;
    activeContactId: string;
  }): Promise<EmailContact> {
    return this.context.proxy.request(EmailRoute.getEmailData, {
      contactId,
      activeContactId,
    });
  }

  /**
   * Create a draft outbound email contact.
   *
   * This does not send the email. This will cause {@link onDraftEmailCreated} to fire.
   *
   * @param {CreateDraftEmailContact} contactCreation the contact creation details
   * @returns {Promise<EmailContactId>} a promise that resolves to the contact id of the draft email contact
   */
  createDraftEmail(
    contactCreation: CreateDraftEmailContact,
  ): Promise<EmailContactId> {
    return this.context.proxy.request(
      EmailRoute.createDraftEmail,
      contactCreation,
    );
  }

  /**
   * Gets the associated email contacts with the contact association id
   *
   * @param {GetEmailThreadParams} getEmailThreadParams the contact association id, optional maxResults and nextToken
   * @returns {Promise<{contacts: EmailThreadContact[]; nextToken?: string;}>} a promise that resolves to the associated email contacts
   */
  getEmailThread(getEmailThreadParams: GetEmailThreadParams): Promise<{
    contacts: EmailThreadContact[];
    nextToken?: string;
  }> {
    return this.context.proxy.request(
      EmailRoute.getEmailThread,
      getEmailThreadParams,
    );
  }

  /**
   * Send the outbound email contact
   *
   * @param {DraftEmailContact} emailContact the email contact to send
   * @returns {Promise<void>} a promise that resolves to void when the email is sent
   */
  sendEmail(emailContact: DraftEmailContact): Promise<void> {
    return this.context.proxy.request(EmailRoute.sendEmail, emailContact);
  }

  /**
   * Subscribe to "The agent has accepted an inbound email contact." events.
   */
  onAcceptedEmail(
    handler: SubscriptionHandler<EmailContactId>,
    contactId?: string,
  ): void {
    this.context.proxy.subscribe(
      {
        key: EmailContactEvents.InboundContactConnected,
        parameter: contactId,
      },
      handler,
    );
  }

  /**
   * Unsubscribe from "The agent has accepted an inbound email contact." events.
   */
  offAcceptedEmail(
    handler: SubscriptionHandler<EmailContactId>,
    contactId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      {
        key: EmailContactEvents.InboundContactConnected,
        parameter: contactId,
      },
      handler,
    );
  }

  /**
   * Subscribe to "An outbound email contact has been assigned to the agent."
   * This fires for an "Agent Initiated Email Conversation"
   */
  onDraftEmailCreated(
    handler: SubscriptionHandler<EmailContactId>,
    contactId?: string,
  ): void {
    this.context.proxy.subscribe(
      {
        key: EmailContactEvents.OutboundContactConnected,
        parameter: contactId,
      },
      handler,
    );
  }

  /**
   * Unsubscribe from "An outbound email contact has been assigned to the agent."
   */
  offDraftEmailCreated(
    handler: SubscriptionHandler<EmailContactId>,
    contactId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      {
        key: EmailContactEvents.OutboundContactConnected,
        parameter: contactId,
      },
      handler,
    );
  }
}

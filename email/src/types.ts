export type EmailContact = {
  contactId: string;
  contactArn: string;

  /**
   * Use this value with the EmailClient.getEmailThread api.
   */
  contactAssociationId: string;

  /**
   * This contact is in response to the specified related contact.
   */
  relatedContactId?: string;

  /**
   * The id of this contact before it was transferred. Each time a contact is transferred, a new contact id is generated.
   */
  initialContactId?: string;

  subject?: string;

  /**
   * This value could be undefined when the email contact has not been sent.
   */
  from?: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];

  /**
   * The email address associated with Amazon Connect that received this message.
   *
   * Only applicable to direction=INBOUND.
   */
  deliveredTo?: EmailAddress;

  /**
   * INBOUND - message was delivered *to* Amazon Connect
   * OUTBOUND - message *from* Amazon Connect
   */
  direction: "INBOUND" | "OUTBOUND";

  /**
   * The message body is stored in a file. This value could be undefined when the email contact has not been sent.
   */
  bodyLocation?: EmailArtifactLocation;
  attachmentLocations: EmailArtifactLocation[];

  /**
   * The timestamp when the email message was delivered to Amazon Connect.
   * Setting this as optional to ensure backward comaptibality.
   */
  initiationTimestamp?: Date;

  /**
   * The traffic type for a contact. This value could be undefined if this segment attribute is not set explicitly during contact creation.
   * @deprecated use messageType instead
   */
  trafficType?: TrafficType;

  /**
   * The message type for a contact. This value could be undefined if this segment attribute is not set explicitly during contact creation.
   */
  messageType?: MessageType;
};

export type TrafficType = "REPLY_TO_CLOSED";

export type MessageType = "FORWARD" | "REPLY_TO_CLOSED";

export type EmailContactId = {
  contactId: string;
};

export type EmailAddress = {
  emailAddress: string;
  displayName?: string;
};

/**
 * @see FileClient use the FileClient to retrieve files from Amazon Connect
 */
export type EmailArtifactLocation = {
  fileId: string;
  associatedResourceArn: string;
};

export type EmailThreadContact = {
  contactId: string;
  contactArn: string;

  previousContactId?: string;
  initialContactId?: string;
  relatedContactId?: string;

  initiationMethod: string;

  initiationTimestamp: Date;
  disconnectTimestamp: Date | undefined;
};

export type DraftEmailContact = {
  /**
   * An array of destination email addresses.
   *
   * Current max length supported: 1
   */
  to: EmailAddress[];

  /**
   * Content of the email.
   */
  emailContent: EmailContent;

  /**
   * The email contact will be sent from this email address.
   *
   *
   * If no from address is provided in the request, the queue MUST have
   * a default email address specified in the Outbound email configuration
   *
   */
  from?: EmailAddress;

  /**
   * Additional recipients to receive a copy of the email.
   *
   * Current max length supported: 10
   */
  cc?: EmailAddress[];

  contactId: string;
};

export type EmailContent = {
  /**
   * Subject of the email. This must NOT be empty
   */
  subject: string;

  /**
   * Body of the email
   */
  body: string;

  /**
   * Email body type
   */
  bodyType: "text/plain" | "text/html";
};

/**
 * Creating an outbound email contact.
 */
export type CreateDraftEmailContact =
  | CreateAgentReplyContact
  | CreateNewConversationContact;

/**
 * This outbound email is being sent in response to an incoming email (contact).
 */
export type CreateAgentReplyContact = CreateDraftEmailContactBase & {
  initiationMethod: "AGENT_REPLY";

  /**
   * Incoming email (contact id) that this email is being sent in response to
   * must be an email contact
   */
  relatedContactId: string;
};

/**
 * This outbound email contact is the start of a new email conversation.
 */
export type CreateNewConversationContact = CreateDraftEmailContactBase & {
  initiationMethod: "OUTBOUND";

  /**
   * Optional reason for starting the new email conversation.
   */
  relatedContactId?: string;
};

type CreateDraftEmailContactBase = Attributable &
  Referenceable & {
    /**
     * An outbound email contact can have one of two initiation methods: "AGENT_REPLY" or "OUTBOUND".
     *
     * "AGENT_REPLY" - This outbound email is being sent in response to an incoming email (contact).
     *
     * The related inbound email's contact id must be provided in the relatedContactId field.
     * The related contact must be an email contact.
     *
     * "OUTBOUND" - This outbound email is the start of a new email conversation.
     *
     * It may optionally be related to another contact of any type via the relatedContactId field.
     */
    initiationMethod: "AGENT_REPLY" | "OUTBOUND";

    /**
     * Length of time before an unsent contact expires.
     *
     * minimum - 1 minute
     * maximum - 1 week
     * default - 12 hours
     */
    expiryDurationInMinutes?: number;

    /**
     * MessageType for the email contact
     *
     * "REPLY_TO_CLOSED" - reply to closed email contact
     * "FORWARD" - forward email contact
     * */
    messageType?: MessageType;
  };

export type Attributable = {
  attributes?: Record<string, string>;
};

export type Referenceable = {
  references?: {
    [refKey: string]: {
      type: string;
      value: string;
    };
  };
};

export type GetEmailThreadParams = {
  /**
   * The contact association id to get the thread for.
   */
  contactAssociationId: string;

  /**
   * The max number of email threads to return.
   *
   * Default maxResults is 100.
   */
  maxResults?: number;

  nextToken?: string;
};

export interface FromEmailAddress extends EmailAddress {
  /**
   * Unique identifier for the from email address
   */
  id: string;

  /**
   * Description of the email address
   */
  description?: string;

  /**
   * Whether this is the default outbound email address
   */
  isDefaultOutboundEmail?: boolean;
}

export type ListFromEmailAddressesParams = {
  /**
   * The contact ID to retrieve email addresses.
   */
  contactId: string;

  /**
   * The max number of email addresses to return.
   * Default maxResults is 50. Maximum value of 50.
   */
  maxResults?: number;
  
  /**
   * The token for the next set of results returned in the previous response 
   */
  nextToken?: string;
};

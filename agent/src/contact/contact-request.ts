export type ContactAttributeKey = string;
export type ContactAttributeValue = string;

export type AllContactAttributes = "*";
export type ContactAttributeFilter =
  | ContactAttributeKey[]
  | AllContactAttributes;

const contactRoutePrefix = "aws.connect.contact::";

export enum ContactRequests {
  getAttributes = contactRoutePrefix + "getAttributes",
  getCustomerDetails = contactRoutePrefix + "getCustomerDetails",
  getContactId = contactRoutePrefix + "getContactId",
  getInitialContactId = contactRoutePrefix + "getInitialContactId",
  getType = contactRoutePrefix + "getType",
  getState = contactRoutePrefix + "getState",
  getStateDuration = contactRoutePrefix + "getStateDuration",
  getQueue = contactRoutePrefix + "getQueue",
  getQueueTimestamp = contactRoutePrefix + "getQueueTimestamp",
  getName = contactRoutePrefix + "getName",
  getDescription = contactRoutePrefix + "getDescription",
  getReferences = contactRoutePrefix + "getReferences",
}

export type ContactRequestRequest = {
  contactId?: string;
};

export type GetAttributesRequest = ContactRequestRequest & {
  attributes?: ContactAttributeFilter;
};

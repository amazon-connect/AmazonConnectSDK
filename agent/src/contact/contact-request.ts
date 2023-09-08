export type ContactData = {
  contactId: string;
  // TODO Define other properties that should be in here
  // There should be nothing in this object that is media channel specific

  // If there are values here that need to be segregated, they should
  // added to separated requests that can have individual permissions
};

export type ContactAttributeKey = string;
export type ContactAttributeValue = string;

export type AllContactAttributes = "*";
export type ContactAttributeFilter =
  | ContactAttributeKey[]
  | AllContactAttributes;

const contactRoutePrefix = "contact/";

export enum ContactCommands {
  getData = contactRoutePrefix + "getData",
  getAttributes = contactRoutePrefix + "getAttributes",
}

export type GetContactRequest = {
  contactId: string;
};

export type GetContactAttributesRequest = {
  contactId: string;
  attributes: ContactAttributeFilter;
};

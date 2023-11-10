export type ContactScope = {
  type: "contact";
  contactId: string;
};

export type ZeroScope = {
  type: "zero";
};

export type AppScope = ContactScope | ZeroScope;

export type ContactScope = {
  type: "contact";
  contactId: string;
};

export type IdleScope = {
  type: "idle";
};

export type AppScope = ContactScope | IdleScope;

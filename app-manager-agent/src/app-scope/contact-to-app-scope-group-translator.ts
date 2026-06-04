import { AppScopeKey } from "@amazon-connect/app-manager";
import { AppScope } from "@amazon-connect/workspace-types";

import { AppScopeGroup } from "./app-scope-group";
import { AppScopeGroupStore } from "./app-scope-group-store";
import { getContactScopeKey, idleScopeKey } from "./app-scope-key-values";

export interface GetContactToAppScopeGroupTranslatorParams {
  appScopeGroupStore: AppScopeGroupStore;
}

export type ContactToAppScopeGroupTranslator = (
  contactId: string | null,
) => AppScopeGroup;

export function getContactToAppScopeGroupTranslator({
  appScopeGroupStore,
}: GetContactToAppScopeGroupTranslatorParams): ContactToAppScopeGroupTranslator {
  return (contactId: string | null) => {
    const scope: AppScope = contactId
      ? { type: "contact", contactId }
      : { type: "idle" };
    const key: AppScopeKey = contactId
      ? getContactScopeKey(contactId)
      : idleScopeKey;

    return appScopeGroupStore.get({ scope, key });
  };
}

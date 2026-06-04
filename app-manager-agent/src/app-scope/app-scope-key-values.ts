import { AppScopeKey } from "@amazon-connect/app-manager";

export const idleScopeKey: AppScopeKey = "idle";
export function getContactScopeKey(contactId: string): AppScopeKey {
  return `contact-${contactId}`;
}

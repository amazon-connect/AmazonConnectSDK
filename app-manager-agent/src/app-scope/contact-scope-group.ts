import { AppScopeGroup } from "./app-scope-group";

export type ContactScopeGroup = AppScopeGroup & { scope: { type: "contact" } };

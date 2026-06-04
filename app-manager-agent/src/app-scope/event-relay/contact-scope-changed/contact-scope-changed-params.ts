import { AmazonConnectProvider } from "@amazon-connect/core";

import { AppScopeGroupStore } from "../../app-scope-group-store";

export type ContactScopeChangedParams = {
  provider: AmazonConnectProvider;
  appScopeGroupStore: AppScopeGroupStore;
};

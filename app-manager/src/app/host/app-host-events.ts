import { SubscriptionHandler } from "@amazon-connect/core";

import { AppHost } from "./app-host";

export type AppHostAdded = {
  appHost: AppHost;
};
export type AppHostAddedHandler = SubscriptionHandler<AppHostAdded>;

export type AppHostRemoved = {
  appHost: AppHost;
};
export type AppHostRemovedHandler = SubscriptionHandler<AppHostRemoved>;

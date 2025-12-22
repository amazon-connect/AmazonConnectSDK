import { AmazonConnectProvider } from "@amazon-connect/core";

import { AppInstanceData } from "../app-instance-data";

export type AppHostParams = AppInstanceData & {
  provider: AmazonConnectProvider;
};

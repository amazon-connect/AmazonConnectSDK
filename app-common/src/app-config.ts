import { AmazonConnectNamespace } from "@amzn/amazon-connect-sdk-core";

export type Permissions = Record<AmazonConnectNamespace, string[]>;

type BaseAppConfig = {
  arn: string;
  _type: string;
  namespace: string;
  id: string;
  name: string;
  description: string;
  accessUrl: string;
  subscriptions: Permissions;
  publications: Permissions;
};

export type IFrameAppConfig = BaseAppConfig & {
  _type: "iframe";
};

// This will provide support for additional types of apps
// such as running an import map
export type AppConfig = IFrameAppConfig;

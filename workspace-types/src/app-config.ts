export type Permission = string;

type BaseAppConfig = {
  arn: string;
  _type: string;
  namespace: string;
  id: string;
  name: string;
  description: string;
  accessUrl: string;
  permissions: Permission[];
};

export type IFrameAppConfig = BaseAppConfig & {
  _type: "iframe";
};

// This will provide support for additional types of apps
// such as running an import map
export type AppConfig = IFrameAppConfig;

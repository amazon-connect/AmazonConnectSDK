type BaseAppConfig = {
  appArn: string;
  name: string;
  _type: string;
  displaySettings?: {
    minHeight?: string | number;
    minWidth?: string | number;
    maxHeight?: string | number;
    maxWidth?: string | number;
  };
};

export type IFrameAppConfig = BaseAppConfig & {
  _type: "iframe";
  location: string;
};

// This will provide support for additional types of apps
// such as running an import map
export type AppConfig = IFrameAppConfig;

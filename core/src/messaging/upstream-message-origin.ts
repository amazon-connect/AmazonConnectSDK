import { ModuleKey } from "../module";

export type SiteMessageOrigin = {
  _type: "site";
  origin: string;
  path: string;
};

export type SharedWorkerMessageOrigin = {
  _type: "sharedWorker";
  module: ModuleKey;
};

export type AppMessageOrigin = {
  _type: "app";
  appInstanceId: string;
  workspace: {
    origin: string;
    path: string;
  };
};

export type UpstreamMessageOrigin =
  | SiteMessageOrigin
  | SharedWorkerMessageOrigin
  | AppMessageOrigin;

export interface HasUpstreamMessageOrigin {
  messageOrigin: UpstreamMessageOrigin;
}

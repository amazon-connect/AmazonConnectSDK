import { AmazonConnectNamespace } from "../amazon-connect-namespace";

export type SiteMessageOrigin = {
  _type: "site";
  origin: string;
  path: string;
};

export type SharedWorkerMessageOrigin = {
  _type: "sharedWorker";
  namespace: AmazonConnectNamespace;
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

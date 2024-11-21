import { UpstreamMessageOrigin } from "@amazon-connect/core";

export type AppMessageOrigin = UpstreamMessageOrigin & {
  _type: "app";
  origin: string;
  path: string;
};

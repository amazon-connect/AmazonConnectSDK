import { UpstreamMessageOrigin } from "@amazon-connect/core";

export type StreamsSiteMessageOrigin = UpstreamMessageOrigin & {
  _type: "streams-site";
  providerId: string;
  origin: string;
  path: string;
};

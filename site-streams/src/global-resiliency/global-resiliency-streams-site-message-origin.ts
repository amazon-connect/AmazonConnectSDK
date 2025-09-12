import { UpstreamMessageOrigin } from "@amazon-connect/core";

import { GlobalResiliencyRegion } from "./global-resiliency-region";

export type GlobalResiliencyStreamsSiteMessageOrigin = UpstreamMessageOrigin & {
  _type: "global-resiliency-streams-site";
  providerId: string;
  activeRegion: GlobalResiliencyRegion;
  origin: string;
  path: string;
};

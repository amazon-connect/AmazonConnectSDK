import { LogLevel } from "../logging";
import { ProxySubjectStatus } from "../proxy";
import { SubscriptionTopic } from "./subscription";

import { HasUpstreamMessageOrigin } from "./upstream-message-origin";

type OptionalUpstreamMessageOrigin = Partial<HasUpstreamMessageOrigin>;

export type SubscribeMessage = {
  type: "subscribe";
  topic: SubscriptionTopic;
} & OptionalUpstreamMessageOrigin;

export type UnsubscribeMessage = {
  type: "unsubscribe";
  topic: SubscriptionTopic;
} & OptionalUpstreamMessageOrigin;

export type LogMessage = {
  type: "log";
  level: LogLevel;
  source: string;
  time: Date;
  message: string;
  loggerId: string;
  data?: Record<string, unknown>;
  context: Record<string, unknown>;
} & OptionalUpstreamMessageOrigin;

export type CloseChannelMessage = {
  type: "closeChannel";
};

export type UpstreamMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | LogMessage
  | CloseChannelMessage;

export type AcknowledgeMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus
> = {
  type: "acknowledge";
  status: T;
};

export type PublishMessage = {
  type: "publish";
  topic: SubscriptionTopic;
  data: Record<string, unknown>;
};

export type DownstreamMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus
> = AcknowledgeMessage<T> | PublishMessage;

import { LogLevel } from "../logging";
import { ProxySubjectStatus } from "../proxy";
import { SubscriptionTopic } from "./subscription";

export type SubscribeMessage = {
  type: "subscribe";
  topic: SubscriptionTopic;
};

export type UnsubscribeMessage = {
  type: "unsubscribe";
  topic: SubscriptionTopic;
};

export type LogMessage = {
  type: "log";
  level: LogLevel;
  source: string;
  time: Date;
  message: string;
  loggerId: string;
  data?: Record<string, unknown>;
  context: Record<string, unknown>;
};

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

export type ErrorMessage<T extends ProxySubjectStatus = ProxySubjectStatus> = {
  type: "error";
  message: string;
  isConnectionError: boolean;
  key: string;
  status: T;
  details?: Record<string, unknown>;
};

export type PublishMessage = {
  type: "publish";
  topic: SubscriptionTopic;
  data: Record<string, unknown>;
};

export type DownstreamMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus
> = AcknowledgeMessage<T> | PublishMessage | ErrorMessage<T>;

import { LogLevel } from "../logging";
import { ProxySubjectStatus } from "../proxy";
import {
  ConnectRequest,
  ConnectRequestData,
  ConnectResponse,
} from "../request";
import { SubscriptionHandlerId, SubscriptionTopic } from "./subscription";
import { HasUpstreamMessageOrigin } from "./upstream-message-origin";

export type RequestMessage<T extends ConnectRequestData = ConnectRequestData> =
  {
    type: "request";
  } & ConnectRequest<T> &
    HasUpstreamMessageOrigin;

export type SubscribeMessage = {
  type: "subscribe";
  topic: SubscriptionTopic;
  handlerId: SubscriptionHandlerId;
} & HasUpstreamMessageOrigin;

export type UnsubscribeMessage = {
  type: "unsubscribe";
  topic: SubscriptionTopic;
} & HasUpstreamMessageOrigin;

export type LogMessage = {
  type: "log";
  level: LogLevel;
  source: string;
  time: Date;
  message: string;
  loggerId: string;
  data?: Record<string, unknown>;
  context: Record<string, unknown>;
} & HasUpstreamMessageOrigin;

export type CloseChannelMessage = {
  type: "closeChannel";
};

export type UpstreamMessage =
  | RequestMessage
  | SubscribeMessage
  | UnsubscribeMessage
  | LogMessage
  | CloseChannelMessage;

export type AcknowledgeMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus,
> = {
  type: "acknowledge";
  status: T;
};

export type ErrorMessage<T extends ProxySubjectStatus = ProxySubjectStatus> = {
  type: "error";
  message: string;
  key: string;
  isFatal: boolean;
  status: T;
  details?: Record<string, unknown>;
};

export type ResponseMessage = {
  type: "response";
} & ConnectResponse;

export type PublishMessage = {
  type: "publish";
  topic: SubscriptionTopic;
  data: Record<string, unknown>;
  handlerId?: SubscriptionHandlerId;
};

export type DownstreamMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus,
> = AcknowledgeMessage<T> | ResponseMessage | PublishMessage | ErrorMessage<T>;

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

export type MetricMessage = {
  type: "metric";
  namespace: string;
  metricName: string;
  unit: string;
  value: number;
  time: Date;
  dimensions: Record<string, string>;
  optionalDimensions: Record<string, string>;
} & HasUpstreamMessageOrigin;

export type CloseChannelMessage = {
  type: "closeChannel";
};

export type HealthCheckMessage = {
  type: "healthCheck";
} & HasUpstreamMessageOrigin;

export type UpstreamMessage =
  | RequestMessage
  | SubscribeMessage
  | UnsubscribeMessage
  | LogMessage
  | MetricMessage
  | CloseChannelMessage
  | HealthCheckMessage;

export type AcknowledgeMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus,
> = {
  type: "acknowledge";
  connectionId: string;
  status: T;
  healthCheckInterval: number;
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
  data: object;
  handlerId?: SubscriptionHandlerId;
};

export type HealthCheckResponseMessage = {
  type: "healthCheckResponse";
  time: number;
  counter: number;
};

export type DownstreamMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus,
> =
  | AcknowledgeMessage<T>
  | ResponseMessage
  | PublishMessage
  | ErrorMessage<T>
  | HealthCheckResponseMessage;

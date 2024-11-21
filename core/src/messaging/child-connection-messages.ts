import { ProxySubjectStatus } from "../proxy";
import { DownstreamMessage, UpstreamMessage } from "./messages";

export type ChildConnectionReadyMessage = {
  type: "childConnectionReady";
};

export type ChildUpstreamMessage = {
  type: "childUpstream";
  sourceProviderId: string;
  parentProviderId: string;
  connectionId: string;
  message: ChildConnectionEnabledUpstreamMessage | ChildConnectionReadyMessage;
};

export type ChildConnectionEnabledUpstreamMessage =
  | UpstreamMessage
  | ChildUpstreamMessage;

export type ChildDownstreamMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus,
> = {
  type: "childDownstreamMessage";
  connectionId: string;
  targetProviderId: string;
  message: ChildConnectionEnabledDownstreamMessage<T>;
};

export type ChildConnectionCloseMessage = {
  type: "childConnectionClose";
  connectionId: string;
};

export type ChildConnectionEnabledDownstreamMessage<
  T extends ProxySubjectStatus = ProxySubjectStatus,
> = DownstreamMessage | ChildDownstreamMessage<T> | ChildConnectionCloseMessage;

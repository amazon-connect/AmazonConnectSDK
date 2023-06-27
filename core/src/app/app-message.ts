import {
  DownstreamMessage,
  UpstreamMessage,
  UpstreamMessageOrigin,
} from "../messaging";
import { SubscriptionHandlerData } from "../messaging/subscription";
import { AppConfig } from "./app-config";
import { AppSubscriptionTopic } from "./app-subscription-topic";
import { LifecycleStage } from "./lifecycle-stage";

export type LifecycleHandlerCompletedMessage = {
  type: "appLifecycleHandlerCompleted";
  stage: LifecycleStage & ("create" | "destroy");
  appInstanceId: string;
};

export type AppPublishMessage = {
  type: "appPublish";
  topic: AppSubscriptionTopic;
  data: SubscriptionHandlerData;
  messageOrigin?: UpstreamMessageOrigin;
};

export type AppUpstreamMessage =
  | UpstreamMessage
  | LifecycleHandlerCompletedMessage
  | AppPublishMessage;

export type LifecycleMessage = {
  type: "appLifecycle";
  stage: LifecycleStage;
  appInstanceId: string;
  appConfig: AppConfig;
};

export type AppDownstreamMessage = DownstreamMessage | LifecycleMessage;

import {
  DownstreamMessage,
  SubscriptionHandlerData,
  SubscriptionTopic,
  UpstreamMessage,
} from "@amazon-connect/core";

import { AppConfig } from "./app-config";
import { LifecycleStage } from "./lifecycle-stage";

export type LifecycleHandlerCompletedMessage = {
  type: "appLifecycleHandlerCompleted";
  stage: LifecycleStage & ("create" | "destroy");
  appInstanceId: string;
};

export type AppPublishMessage = {
  type: "appPublish";
  topic: SubscriptionTopic;
  data: SubscriptionHandlerData;
};

export type CloseAppMessage = {
  type: "closeApp";
  isFatalError: boolean;
  message?: string;
  data?: Record<string, unknown> | Error;
};

export type AppUpstreamMessage =
  | UpstreamMessage
  | LifecycleHandlerCompletedMessage
  | AppPublishMessage
  | CloseAppMessage;

export type LifecycleMessage = {
  type: "appLifecycle";
  stage: LifecycleStage;
  appInstanceId: string;
  appConfig: AppConfig;
};

export type AppDownstreamMessage = DownstreamMessage | LifecycleMessage;

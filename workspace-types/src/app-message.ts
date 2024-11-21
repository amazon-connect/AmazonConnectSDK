import {
  ChildConnectionEnabledDownstreamMessage,
  ChildConnectionEnabledUpstreamMessage,
  ChildUpstreamMessage,
  SubscriptionHandlerData,
  SubscriptionTopic,
  UpstreamMessageOrigin,
} from "@amazon-connect/core";

import { AppConfig } from "./app-config";
import { AppScope, ContactScope } from "./app-scope";
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
  messageOrigin?: UpstreamMessageOrigin;
};

export type CloseAppMessage = {
  type: "closeApp";
  isFatalError: boolean;
  message?: string;
  data?: Record<string, unknown> | Error;
};

export type AppUpstreamMessage =
  | ChildConnectionEnabledUpstreamMessage
  | ChildUpstreamMessage
  | AppPublishMessage
  | LifecycleHandlerCompletedMessage
  | CloseAppMessage;

export type LifecycleMessage = {
  type: "appLifecycle";
  stage: LifecycleStage;
  appInstanceId: string;
  appConfig: AppConfig;
  scope?: AppScope;

  /**
   * @deprecated Use `scope` instead.
   */
  contactScope?: ContactScope;
};

export type AppDownstreamMessage =
  | ChildConnectionEnabledDownstreamMessage
  | LifecycleMessage;

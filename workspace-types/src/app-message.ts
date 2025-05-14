import {
  ChildConnectionEnabledDownstreamMessage,
  ChildConnectionEnabledUpstreamMessage,
  ChildUpstreamMessage,
  SubscriptionHandlerData,
  SubscriptionTopic,
  UpstreamMessageOrigin,
} from "@amazon-connect/core";

import { AppParameters } from "./app-parameters";
import { AppScope, ContactScope } from "./app-scope";
import { AppConfig, ConfigBase } from "./config";
import { LaunchSource } from "./launch-source";
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

export type ServiceErrorMessage = {
  type: "serviceError";
  message?: string;
  data?: Record<string, unknown> | Error;
};

export type AppUpstreamMessage =
  | ChildConnectionEnabledUpstreamMessage
  | ChildUpstreamMessage
  | AppPublishMessage
  | LifecycleHandlerCompletedMessage
  | CloseAppMessage
  | ServiceErrorMessage;

export type LifecycleMessage = {
  type: "appLifecycle";
  stage: LifecycleStage;
  /**
   * @deprecated This property is deprecated. Use `instanceId` instead.
   */
  appInstanceId: string;
  instanceId: string;
  /**
   * @deprecated This property is deprecated. Use `config` instead.
   */
  appConfig: AppConfig;
  config: ConfigBase;
  scope?: AppScope;
  parameters?: AppParameters;
  launchedBy?: LaunchSource;

  /**
   * @deprecated Use `scope` instead.
   */
  contactScope?: ContactScope;
};

export type AppDownstreamMessage =
  | ChildConnectionEnabledDownstreamMessage
  | LifecycleMessage;

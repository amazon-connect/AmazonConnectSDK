import { ModuleKey } from "../../module";

export type SubscriptionTopicKey = string;
export type SubscriptionTopicParameter = string;

export type SubscriptionTopicWithModule = {
  module: ModuleKey;
} & SubscriptionTopic;

export type SubscriptionTopic = {
  key: SubscriptionTopicKey;
  parameter?: SubscriptionTopicParameter;
};

export type SubscriptionHandlerData = Record<string, unknown>;

export type SubscriptionHandler<
  T extends SubscriptionHandlerData = SubscriptionHandlerData
> = (evt: T) => Promise<void>;

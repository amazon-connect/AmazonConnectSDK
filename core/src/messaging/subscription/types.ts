import { AmazonConnectNamespace } from "../../amazon-connect-namespace";

export type SubscriptionTopicKey = string;
export type SubscriptionTopicParameter = string;

export type SubscriptionTopic = {
  namespace: AmazonConnectNamespace;
  key: SubscriptionTopicKey;
  parameter?: SubscriptionTopicParameter;
};

export type ModuleSubscriptionTopic = Omit<SubscriptionTopic, "namespace">;

export type SubscriptionHandlerData = Record<string, unknown>;

export type SubscriptionHandler<
  T extends SubscriptionHandlerData = SubscriptionHandlerData,
> = (evt: T) => Promise<void>;

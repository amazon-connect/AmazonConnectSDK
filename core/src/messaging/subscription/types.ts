import { AmazonConnectNamespace } from "../../amazon-connect-namespace";

export type SubscriptionTopicKey = string;
export type SubscriptionTopicParameter = string;

export type SubscriptionTopic = {
  namespace: AmazonConnectNamespace;
  key: SubscriptionTopicKey;
  parameter?: SubscriptionTopicParameter;
};

export type ModuleSubscriptionTopic = Omit<SubscriptionTopic, "namespace">;

export type SubscriptionHandlerData = object;

export type SubscriptionHandler<
  T extends SubscriptionHandlerData = SubscriptionHandlerData,
> = (evt: T) => Promise<void>;

export type SubscriptionHandlerId = string;
export type SubscriptionHandlerIdMapping = {
  handler: SubscriptionHandler;
  handlerId: SubscriptionHandlerId;
};

export type SubscriptionTopicHandlerIdItem = {
  topic: SubscriptionTopic;
  handlerId: SubscriptionHandlerId;
};

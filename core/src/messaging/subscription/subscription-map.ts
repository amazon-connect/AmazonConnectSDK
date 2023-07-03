import { AmazonConnectNamespace } from "../../amazon-connect-namespace";
import {
  SubscriptionTopic,
  SubscriptionTopicKey,
  SubscriptionTopicParameter,
} from "./types";

export class SubscriptionMap<T = any> {
  private readonly simpleSubscriptions: Record<
    AmazonConnectNamespace,
    Record<SubscriptionTopicKey, Set<T>>
  > = {};

  private readonly paramSubscriptions: Record<
    string,
    Record<SubscriptionTopicKey, Record<SubscriptionTopicParameter, Set<T>>>
  > = {};

  add({ namespace, key, parameter: param }: SubscriptionTopic, item: T): void {
    if (param) {
      if (!this.paramSubscriptions[namespace]) {
        this.paramSubscriptions[namespace] = {
          [key]: { [param]: new Set([item]) },
        };
        return;
      }
      if (!this.paramSubscriptions[namespace][key]) {
        this.paramSubscriptions[namespace][key] = {
          [param]: new Set([item]),
        };
        return;
      }
      if (!this.paramSubscriptions[namespace][key][param]) {
        this.paramSubscriptions[namespace][key][param] = new Set([item]);
        return;
      } else this.paramSubscriptions[namespace][key][param].add(item);
    } else {
      if (!this.simpleSubscriptions[namespace]) {
        this.simpleSubscriptions[namespace] = { [key]: new Set([item]) };
        return;
      }
      if (!this.simpleSubscriptions[namespace][key]) {
        this.simpleSubscriptions[namespace][key] = new Set([item]);
        return;
      } else this.simpleSubscriptions[namespace][key].add(item);
    }
  }

  remove(
    { namespace, key, parameter: param }: SubscriptionTopic,
    item: T
  ): void {
    if (param) {
      if (
        this.paramSubscriptions[namespace] &&
        this.paramSubscriptions[namespace][key] &&
        this.paramSubscriptions[namespace][key][param]
      ) {
        this.paramSubscriptions[namespace][key][param].delete(item);
        if (this.paramSubscriptions[namespace][key][param].size < 1) {
          delete this.paramSubscriptions[namespace][key][param];

          if (Object.keys(this.paramSubscriptions[namespace][key]).length < 1) {
            delete this.paramSubscriptions[namespace][key];
            if (Object.keys(this.paramSubscriptions[namespace]).length < 1) {
              delete this.paramSubscriptions[namespace];
            }
          }
        }
      }
    } else {
      if (
        this.simpleSubscriptions[namespace] &&
        this.simpleSubscriptions[namespace][key]
      ) {
        this.simpleSubscriptions[namespace][key].delete(item);

        if (this.simpleSubscriptions[namespace][key].size < 1) {
          delete this.simpleSubscriptions[namespace][key];
          if (Object.keys(this.simpleSubscriptions[namespace]).length < 1) {
            delete this.simpleSubscriptions[namespace];
          }
        }
      }
    }
  }

  get({ namespace, key, parameter: param }: SubscriptionTopic): T[] {
    if (!param) {
      if (
        this.simpleSubscriptions[namespace] &&
        this.simpleSubscriptions[namespace][key]
      ) {
        return [...this.simpleSubscriptions[namespace][key]];
      }
    } else {
      if (
        this.paramSubscriptions[namespace] &&
        this.paramSubscriptions[namespace][key] &&
        this.paramSubscriptions[namespace][key][param]
      ) {
        return [...this.paramSubscriptions[namespace][key][param]];
      }
    }
    // No Subscriptions
    return [];
  }

  getAllSubscriptions(): SubscriptionTopic[] {
    const noParam = Object.keys(this.simpleSubscriptions).flatMap((namespace) =>
      Object.keys(this.simpleSubscriptions[namespace]).flatMap((key) => ({
        namespace,
        key,
      }))
    );

    const withParam = Object.keys(this.simpleSubscriptions).flatMap(
      (namespace) =>
        Object.keys(this.simpleSubscriptions[namespace]).flatMap((key) =>
          Object.keys(this.simpleSubscriptions[namespace][key]).flatMap(
            (parameter) => ({
              namespace,
              key,
              parameter,
            })
          )
        )
    );

    return [...noParam, ...withParam];
  }
}

import { AmazonConnectNamespace } from "../../amazon-connect-namespace";
import {
  SubscriptionTopic,
  SubscriptionTopicKey,
  SubscriptionTopicParameter,
} from "./types";

export class SubscriptionMap<T> {
  private readonly simpleSubscriptions: Map<
    AmazonConnectNamespace,
    Map<SubscriptionTopicKey, T>
  > = new Map();

  private readonly paramSubscriptions: Map<
    string,
    Map<SubscriptionTopicKey, Map<SubscriptionTopicParameter, T>>
  > = new Map();

  add({ namespace, key, parameter: param }: SubscriptionTopic, value: T): void {
    if (param) {
      if (!this.paramSubscriptions.has(namespace)) {
        this.paramSubscriptions.set(
          namespace,
          new Map([[key, new Map([[param, value]])]])
        );
        return;
      }
      if (!this.paramSubscriptions.get(namespace)?.has(key)) {
        this.paramSubscriptions
          .get(namespace)
          ?.set(key, new Map([[param, value]]));
        return;
      }
      this.paramSubscriptions.get(namespace)?.get(key)?.set(param, value);
    } else {
      if (!this.simpleSubscriptions.has(namespace)) {
        this.simpleSubscriptions.set(namespace, new Map([[key, value]]));
        return;
      } else this.simpleSubscriptions.get(namespace)?.set(key, value);
    }
  }

  delete({ namespace, key, parameter: param }: SubscriptionTopic): void {
    if (param) {
      if (this.paramSubscriptions.get(namespace)?.get(key)?.delete(param)) {
        if (this.paramSubscriptions.get(namespace)!.get(key)!.size < 1) {
          this.paramSubscriptions.get(namespace)?.delete(key);

          if (this.paramSubscriptions.get(namespace)!.size < 1) {
            this.paramSubscriptions.delete(namespace);
          }
        }
      }
    } else {
      if (this.simpleSubscriptions.get(namespace)?.delete(key)) {
        if (this.simpleSubscriptions.get(namespace)!.size < 1) {
          this.simpleSubscriptions.delete(namespace);
        }
      }
    }
  }

  get({ namespace, key, parameter: param }: SubscriptionTopic): T | undefined {
    if (!param) {
      return this.simpleSubscriptions.get(namespace)?.get(key);
    } else {
      return this.paramSubscriptions.get(namespace)?.get(key)?.get(param);
    }
  }

  getOrAdd(topic: SubscriptionTopic, addFactory: () => T): T {
    let value = this.get(topic);

    if (!value) {
      value = addFactory();
      this.add(topic, value);
    }

    return value;
  }

  addOrUpdate(
    topic: SubscriptionTopic,
    addFactory: () => T,
    updateAction: (value: T) => T
  ): T {
    let value = this.get(topic);

    if (value) {
      value = updateAction(value);
    } else {
      value = addFactory();
    }
    this.add(topic, value);
    return value;
  }

  getAllSubscriptions(): SubscriptionTopic[] {
    const noParam = Array.from(this.simpleSubscriptions.keys()).flatMap(
      (namespace) =>
        Array.from(this.simpleSubscriptions.get(namespace)!.keys()).flatMap(
          (key) => ({
            namespace,
            key,
          })
        )
    );

    const withParam = Array.from(this.paramSubscriptions.keys()).flatMap(
      (namespace) =>
        Array.from(this.paramSubscriptions.get(namespace)!.keys()).flatMap(
          (key) =>
            Array.from(
              this.paramSubscriptions.get(namespace)!.get(key)!.keys()
            ).flatMap((parameter) => ({
              namespace,
              key,
              parameter,
            }))
        )
    );

    return [...noParam, ...withParam];
  }
}

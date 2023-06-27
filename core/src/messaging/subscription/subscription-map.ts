import { ModuleKey } from "../../module";
import {
  SubscriptionTopicKey,
  SubscriptionTopicParameter,
  SubscriptionTopicWithModule,
} from "./types";

export class SubscriptionMap<T = any> {
  private readonly simpleSubscriptions: Record<
    ModuleKey,
    Record<SubscriptionTopicKey, Set<T>>
  > = {};

  private readonly paramSubscriptions: Record<
    string,
    Record<SubscriptionTopicKey, Record<SubscriptionTopicParameter, Set<T>>>
  > = {};

  add(
    { module, key, parameter: param }: SubscriptionTopicWithModule,
    item: T
  ): void {
    if (param) {
      if (!this.paramSubscriptions[module]) {
        this.paramSubscriptions[module] = {
          [key]: { [param]: new Set([item]) },
        };
        return;
      }
      if (!this.paramSubscriptions[module][key]) {
        this.paramSubscriptions[module][key] = {
          [param]: new Set([item]),
        };
        return;
      }
      if (!this.paramSubscriptions[module][key][param]) {
        this.paramSubscriptions[module][key][param] = new Set([item]);
        return;
      } else this.paramSubscriptions[module][key][param].add(item);
    } else {
      if (!this.simpleSubscriptions[module]) {
        this.simpleSubscriptions[module] = { [key]: new Set([item]) };
        return;
      }
      if (!this.simpleSubscriptions[module][key]) {
        this.simpleSubscriptions[module][key] = new Set([item]);
        return;
      } else this.simpleSubscriptions[module][key].add(item);
    }
  }

  remove(
    { module, key, parameter: param }: SubscriptionTopicWithModule,
    item: T
  ): void {
    if (param) {
      if (
        this.paramSubscriptions[module] &&
        this.paramSubscriptions[module][key] &&
        this.paramSubscriptions[module][key][param]
      ) {
        this.paramSubscriptions[module][key][param].delete(item);
        if (this.paramSubscriptions[module][key][param].size < 1) {
          delete this.paramSubscriptions[module][key][param];

          if (Object.keys(this.paramSubscriptions[module][key]).length < 1) {
            delete this.paramSubscriptions[module][key];
            if (Object.keys(this.paramSubscriptions[module]).length < 1) {
              delete this.paramSubscriptions[module];
            }
          }
        }
      }
    } else {
      if (
        this.simpleSubscriptions[module] &&
        this.simpleSubscriptions[module][key]
      ) {
        this.simpleSubscriptions[module][key].delete(item);

        if (this.simpleSubscriptions[module][key].size < 1) {
          delete this.simpleSubscriptions[module][key];
          if (Object.keys(this.simpleSubscriptions[module]).length < 1) {
            delete this.simpleSubscriptions[module];
          }
        }
      }
    }
  }

  get({ module, key, parameter: param }: SubscriptionTopicWithModule): T[] {
    if (!param) {
      if (
        this.simpleSubscriptions[module] &&
        this.simpleSubscriptions[module][key]
      ) {
        return [...this.simpleSubscriptions[module][key]];
      }
    } else {
      if (
        this.paramSubscriptions[module] &&
        this.paramSubscriptions[module][key] &&
        this.paramSubscriptions[module][key][param]
      ) {
        return [...this.paramSubscriptions[module][key][param]];
      }
    }
    // No Subscriptions
    return [];
  }

  getAllSubscriptions(): SubscriptionTopicWithModule[] {
    const noParam = Object.keys(this.simpleSubscriptions).flatMap((module) =>
      Object.keys(this.simpleSubscriptions[module]).flatMap((key) => ({
        module,
        key,
      }))
    );

    const withParam = Object.keys(this.simpleSubscriptions).flatMap((module) =>
      Object.keys(this.simpleSubscriptions[module]).flatMap((key) =>
        Object.keys(this.simpleSubscriptions[module][key]).flatMap(
          (parameter) => ({
            module,
            key,
            parameter,
          })
        )
      )
    );

    return [...noParam, ...withParam];
  }
}

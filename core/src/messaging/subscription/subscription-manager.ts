import { SubscriptionHandlerIdMap } from "./subscription-handler-id-map";
import { SubscriptionMap } from "./subscription-map";
import {
  SubscriptionHandler,
  SubscriptionHandlerId,
  SubscriptionHandlerIdMapping,
  SubscriptionTopic,
} from "./types";

export class SubscriptionManager {
  private readonly subscriptions: SubscriptionMap<SubscriptionHandlerIdMap>;

  constructor() {
    this.subscriptions = new SubscriptionMap();
  }

  add(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler,
  ): { handlerId: SubscriptionHandlerId } {
    return this.subscriptions
      .getOrAdd(topic, () => new SubscriptionHandlerIdMap())
      .add(handler);
  }

  get(topic: SubscriptionTopic): SubscriptionHandlerIdMapping[] {
    return this.subscriptions.get(topic)?.get() ?? [];
  }

  getById(
    topic: SubscriptionTopic,
    handlerId: SubscriptionHandlerId,
  ): SubscriptionHandler | null {
    return this.subscriptions.get(topic)?.getHandlerById(handlerId) ?? null;
  }

  delete(topic: SubscriptionTopic, handler: SubscriptionHandler): void {
    if (this.subscriptions.get(topic)?.delete(handler).isEmpty ?? false) {
      this.subscriptions.delete(topic);
    }
  }

  size(topic: SubscriptionTopic): number {
    return this.subscriptions.get(topic)?.size() ?? 0;
  }

  isEmpty(topic: SubscriptionTopic): boolean {
    return this.size(topic) === 0;
  }

  getAllSubscriptions(): SubscriptionTopic[] {
    return this.subscriptions.getAllSubscriptions();
  }
}

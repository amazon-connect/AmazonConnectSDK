import { SubscriptionMap } from "./subscription-map";
import { SubscriptionTopic } from "./types";

export class SubscriptionSet<T> {
  private readonly map: SubscriptionMap<Set<T>> = new SubscriptionMap();

  add(topic: SubscriptionTopic, value: T): void {
    this.map.addOrUpdate(
      topic,
      () => new Set([value]),
      (s) => s.add(value),
    );
  }

  delete(topic: SubscriptionTopic, value: T): void {
    const s = this.map.get(topic);

    if (s) {
      s.delete(value);

      if (s.size === 0) {
        this.map.delete(topic);
      }
    }
  }

  get(topic: SubscriptionTopic): T[] {
    return [...(this.map.get(topic) ?? [])];
  }

  size(topic: SubscriptionTopic): number {
    return this.map.get(topic)?.size ?? 0;
  }

  isEmpty(topic: SubscriptionTopic): boolean {
    return this.size(topic) === 0;
  }

  getAllSubscriptions(): SubscriptionTopic[] {
    return this.map.getAllSubscriptions();
  }
}

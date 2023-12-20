import { generateUUID } from "../../utility";
import {
  SubscriptionHandler,
  SubscriptionHandlerId,
  SubscriptionHandlerIdMapping,
} from "./types";

export class SubscriptionHandlerIdMap {
  private readonly idsByHandler: Map<
    SubscriptionHandler,
    SubscriptionHandlerId
  >;
  private readonly handlersById: Map<
    SubscriptionHandlerId,
    SubscriptionHandler
  >;

  constructor() {
    this.idsByHandler = new Map();
    this.handlersById = new Map();
  }

  add(handler: SubscriptionHandler): { handlerId: SubscriptionHandlerId } {
    const existingId = this.idsByHandler.get(handler);

    if (existingId) {
      return { handlerId: existingId };
    }

    const handlerId = generateUUID();

    this.idsByHandler.set(handler, handlerId);
    this.handlersById.set(handlerId, handler);

    return { handlerId };
  }

  getIdByHandler(handler: SubscriptionHandler): SubscriptionHandlerId | null {
    return this.idsByHandler.get(handler) ?? null;
  }

  getHandlerById(id: SubscriptionHandlerId): SubscriptionHandler | null {
    return this.handlersById.get(id) ?? null;
  }

  get(): SubscriptionHandlerIdMapping[] {
    return [...this.idsByHandler.entries()].map(([handler, handlerId]) => ({
      handler,
      handlerId,
    }));
  }

  delete(handler: SubscriptionHandler): { isEmpty: boolean } {
    const handlerId = this.idsByHandler.get(handler);

    if (handlerId) this.handlersById.delete(handlerId);
    this.idsByHandler.delete(handler);

    return { isEmpty: this.idsByHandler.size < 1 };
  }

  size(): number {
    return this.idsByHandler.size;
  }
}

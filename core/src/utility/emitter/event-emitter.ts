import { EmitterBase } from "./emitter-base";

export class EventEmitter<TEvent> extends EmitterBase<(evt: TEvent) => void> {
  emit(parameter: string, event: TEvent): void {
    const handlers = this.getHandlers(parameter);
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        this.logger.error("An error occurred when invoking event handler", {
          error,
          parameter,
        });
      }
    }
  }
}

import { EmitterBase } from "./emitter-base";

export class AsyncEventEmitter<TEvent> extends EmitterBase<
  (evt: TEvent) => Promise<void>
> {
  async emit(parameter: string, event: TEvent): Promise<void> {
    const handlers = this.getHandlers(parameter);
    await Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          this.logger.error("An error occurred when invoking event handler", {
            error,
            parameter,
          });
        }
      }),
    );
  }
}

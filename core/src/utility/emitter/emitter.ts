import { EmitterBase } from "./emitter-base";

export class Emitter extends EmitterBase<() => void> {
  emit(parameter: string): void {
    for (const handler of this.getHandlers(parameter)) {
      try {
        handler();
      } catch (error) {
        this.logger.error("An error occurred when invoking handler", {
          error,
          parameter,
        });
      }
    }
  }
}

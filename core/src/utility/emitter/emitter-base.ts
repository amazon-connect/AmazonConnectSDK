import { ConnectLogger, LogProvider } from "../../logging";

export type EmitterParams = {
  provider: LogProvider;
  loggerKey?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EmitterHandler = (...args: any[]) => Promise<void> | void;

export abstract class EmitterBase<THandler extends EmitterHandler> {
  private readonly events: Map<string, Set<THandler>>;
  protected readonly logger: ConnectLogger;

  constructor({ provider, loggerKey }: EmitterParams) {
    this.events = new Map();

    this.logger = new ConnectLogger({
      provider,
      source: "emitter",
      mixin: () => ({
        emitterLoggerKey: loggerKey,
      }),
    });
  }

  on(parameter: string, handler: THandler): void {
    const set = this.events.get(parameter);
    if (set) set.add(handler);
    else this.events.set(parameter, new Set([handler]));
  }

  off(parameter: string, handler: THandler): void {
    const set = this.events.get(parameter);
    if (set) {
      set.delete(handler);
      if (set.size < 1) this.events.delete(parameter);
    }
  }

  protected getHandlers(parameter: string): THandler[] {
    return Array.from(this.events.get(parameter) ?? []);
  }
}

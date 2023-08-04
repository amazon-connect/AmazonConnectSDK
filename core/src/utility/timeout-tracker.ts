import { ConnectLogger } from "../logging";

export type TimeoutTrackerStatus = "running" | "completed" | "cancelled";

export type TimeoutTrackerCancelledEvent = {
  timeoutMs: number;
};

export type TimeoutTrackerCancelledHandler = (
  evt: TimeoutTrackerCancelledEvent
) => void;

export class TimeoutTracker {
  public readonly timeoutMs;
  private readonly onCancelled: TimeoutTrackerCancelledHandler;
  private status: TimeoutTrackerStatus;
  private readonly logger: ConnectLogger;
  private timeout: NodeJS.Timeout;

  constructor(onCancelled: TimeoutTrackerCancelledHandler, timeoutMs: number) {
    this.timeoutMs = timeoutMs;
    this.onCancelled = onCancelled;
    this.timeout = setTimeout(() => this.handleCancel(), this.timeoutMs);
    this.status = "running";
    this.logger = new ConnectLogger({
      source: "core.utility.timeout-tracker",
      mixin: () => ({
        timeoutMs: this.timeoutMs,
        timeoutTrackerStatus: this.status,
      }),
    });
  }

  static start(
    onCancelled: TimeoutTrackerCancelledHandler,
    ms: number
  ): TimeoutTracker {
    return new TimeoutTracker(onCancelled, ms);
  }

  complete(): boolean {
    switch (this.status) {
      case "running":
        return this.handleComplete();
      case "completed":
        this.logger.debug("TimeoutTracker already marked complete. No action.");
        return true;
      case "cancelled":
        this.logger.info(
          "Attempted to complete a TimeoutTracker that has already been cancelled"
        );
        return false;
      default:
        throw new Error(`Unknown TimeoutStatus ${this.status}`);
    }
  }

  isCancelled(): boolean {
    return this.status === "cancelled";
  }

  getStatus(): TimeoutTrackerStatus {
    return this.status;
  }

  private handleCancel(): void {
    switch (this.status) {
      case "running":
        this.status = "cancelled";
        this.logger.info(
          "TimeoutTracker has timed out. Invoking onCancelled Handler"
        );
        this.invokeOnCancelled();
        break;
      case "completed":
        this.logger.debug(
          "Cancel operation for TimerTracker invoked after already completed. No action."
        );
        break;
      default:
        throw new Error(
          "Cancel operation in TimerTracker called during an unexpected time."
        );
    }
  }

  private handleComplete(): boolean {
    this.status = "completed";
    clearTimeout(this.timeout);
    return true;
  }

  private invokeOnCancelled() {
    try {
      this.onCancelled({ timeoutMs: this.timeoutMs });
    } catch (error) {
      this.logger.error(
        "Error when attempting to invoke TimeoutTrackerCancelledHandler",
        { error }
      );
    }
  }
}

import { ConnectLogger } from "../../logging";
import { UpstreamError, UpstreamErrorHandler } from "./types";

export class UpstreamErrorService {
  private readonly errorHandlers: Set<UpstreamErrorHandler>;
  private readonly logger: ConnectLogger;

  constructor() {
    this.errorHandlers = new Set();
    this.logger = new ConnectLogger({
      source: "core.proxy.error",
    });
  }

  invoke(error: UpstreamError): void {
    const { message, key, details, isConnectionError, connectionStatus } =
      error;

    this.logger.error(
      message,
      {
        key,
        details,
        isConnectionError,
        connectionStatus,
      },
      { duplicateMessageToConsole: true, remoteIgnore: true }
    );

    [...this.errorHandlers].forEach((handler) => {
      try {
        handler(error);
      } catch (handlerError) {
        this.logger.error("An error occurred within a UpstreamErrorHandler", {
          handlerError,
          originalError: error,
        });
      }
    });
  }

  onError(handler: UpstreamErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  offError(handler: UpstreamErrorHandler): void {
    this.errorHandlers.delete(handler);
  }
}

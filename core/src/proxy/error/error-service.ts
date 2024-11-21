import {
  AmazonConnectError,
  AmazonConnectErrorHandler,
} from "../../amazon-connect-error";
import { ConnectLogger, LogProvider } from "../../logging";

export class ErrorService {
  private readonly errorHandlers: Set<AmazonConnectErrorHandler>;
  private readonly logger: ConnectLogger;

  constructor(provider: LogProvider) {
    this.errorHandlers = new Set();
    this.logger = new ConnectLogger({
      provider,
      source: "core.proxy.error",
    });
  }

  invoke(error: AmazonConnectError): void {
    const { message, key, details, isFatal, connectionStatus } = error;

    this.logger.error(
      message,
      {
        key,
        details,
        isFatal,
        connectionStatus,
      },
      { duplicateMessageToConsole: true, remoteIgnore: true },
    );

    [...this.errorHandlers].forEach((handler) => {
      try {
        handler(error);
      } catch (handlerError) {
        this.logger.error(
          "An error occurred within a AmazonConnectErrorHandler",
          {
            handlerError,
            originalError: error,
          },
        );
      }
    });
  }

  onError(handler: AmazonConnectErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  offError(handler: AmazonConnectErrorHandler): void {
    this.errorHandlers.delete(handler);
  }
}

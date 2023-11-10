import { ConnectLogger } from "../logging";
import { RequestMessage, ResponseMessage } from "../messaging";
import {
  createRequestHandler,
  ResponseHandler,
} from "./request-handler-factory";
import { ConnectResponseData, RequestId } from "./request-handlers";

export class RequestManager {
  private readonly requestMap: Map<RequestId, ResponseHandler>;
  private readonly logger: ConnectLogger;

  constructor() {
    this.requestMap = new Map();
    this.logger = new ConnectLogger({
      source: "core.requestManager",
    });
  }

  processRequest<TResponse extends ConnectResponseData>(
    request: RequestMessage,
  ): Promise<TResponse> {
    const { requestId } = request;

    return createRequestHandler(
      request,
      (handler) => this.requestMap.set(requestId, handler),
      ({ request, timeoutMs }) => this.handleTimeout(request, timeoutMs),
    );
  }

  processResponse(response: ResponseMessage): void {
    const { requestId } = response;

    const handler = this.requestMap.get(requestId);

    if (!handler) {
      // The proxy is implemented such that this should never happen
      this.logger.error("Returned a response message with no handler", {
        message: response,
      });
      return;
    }

    handler(response);
    this.requestMap.delete(requestId);
  }

  private handleTimeout(request: RequestMessage, timeoutMs: number): void {
    const { requestId, namespace, command } = request;
    this.requestMap.delete(requestId);

    this.logger.error("Client request timeout", {
      requestId,
      namespace,
      command,
      timeoutMs,
    });
  }
}

import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { RequestMessage, UpstreamMessageOrigin } from "../messaging";
import { generateUUID } from "../utility";
import { ConnectRequestData } from "./request-handlers";

export function createRequestMessage(
  namespace: AmazonConnectNamespace,
  command: string,
  data: ConnectRequestData | undefined,
  messageOrigin: UpstreamMessageOrigin,
): RequestMessage {
  const requestId = generateUUID();
  return {
    type: "request",
    namespace,
    command,
    requestId,
    data,
    messageOrigin,
  };
}

import { LogMessage, UpstreamMessageOrigin } from "../messaging";
import { ProxyLogData } from "./proxy-log-data";
import { sanitizeData } from "./sanitize-data";

export function createLogMessage(
  { level, source, message, loggerId, data }: ProxyLogData,
  context: Record<string, unknown>,
  messageOrigin: UpstreamMessageOrigin,
): LogMessage {
  // Sanitize guards against a caller provided data object containing a
  // non-cloneable object which will fail if sent through a message channel
  const sanitizedData = sanitizeData(data);

  return {
    type: "log",
    level,
    time: new Date(),
    source,
    message,
    loggerId,
    data: sanitizedData,
    context,
    messageOrigin,
  };
}

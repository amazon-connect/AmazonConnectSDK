import { LogMessage, UpstreamMessageOrigin } from "../messaging";
import { ConnectLogData } from "./logger-types";
import { ProxyLogData } from "./proxy-log-data";

export function createLogMessage(
  { level, source, message, loggerId, data }: ProxyLogData,
  context: Record<string, unknown>,
  messageOrigin: UpstreamMessageOrigin,
): LogMessage {
  // Sanitize guards against a caller provided data object containing a
  // non-cloneable object which will fail if sent through a message channel
  const sanitizedData = data
    ? (JSON.parse(JSON.stringify(data)) as ConnectLogData)
    : undefined;

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

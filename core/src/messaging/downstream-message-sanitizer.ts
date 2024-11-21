import { ChildConnectionEnabledDownstreamMessage } from "./child-connection-messages";

export function sanitizeDownstreamMessage(
  message: ChildConnectionEnabledDownstreamMessage,
): Record<string, unknown> {
  try {
    switch (message.type) {
      case "acknowledge":
      case "error":
      case "childConnectionClose":
        return message;
      case "childDownstreamMessage":
        return {
          ...message,
          message: sanitizeDownstreamMessage(message.message),
        };
      case "publish": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data, ...other } = message;
        return { ...other };
      }
      case "response": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        if (message.isError)
          return { ...message, details: { command: message.details.command } };
        else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { data, ...other } = message;
          return { ...other };
        }
      }
      default:
        return message;
    }
  } catch (error) {
    return {
      messageDetails: "error when sanitizing downstream message",
      message,
      error,
    };
  }
}

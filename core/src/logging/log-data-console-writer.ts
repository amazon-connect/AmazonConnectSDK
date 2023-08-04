import { LogLevel } from "./log-level";
import { ConnectLogData } from "./logger-types";

export function logToConsole(
  level: LogLevel | undefined,
  message: string,
  data?: ConnectLogData
) {
  if (data) {
    switch (level) {
      case LogLevel.error:
        console.error(message, data);
        break;
      case LogLevel.warn:
        console.warn(message, data);
        break;
      case LogLevel.info:
        console.info(message, data);
        break;
      case LogLevel.debug:
        console.debug(message, data);
        break;
      case LogLevel.trace:
        console.trace(message, data);
        break;
      default:
        console.log(message, data);
        break;
    }
  } else {
    switch (level) {
      case LogLevel.error:
        console.error(message);
        break;
      case LogLevel.warn:
        console.warn(message);
        break;
      case LogLevel.info:
        console.info(message);
        break;
      case LogLevel.debug:
        console.debug(message);
        break;
      case LogLevel.trace:
        console.trace(message);
        break;
      default:
        console.log(message);
        break;
    }
  }
}

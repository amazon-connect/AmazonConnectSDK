import { LogLevel } from "./logging";

export type AmazonConnectConfig = {
  // Defaults to LogLevel.error
  logging?: { minLogToConsoleLevel?: LogLevel };
};

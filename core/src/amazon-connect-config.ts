import { LogLevel } from "./logging";

export interface AmazonConnectConfig {
  // Defaults to LogLevel.error
  logging?: { minLogToConsoleLevel?: LogLevel };
}

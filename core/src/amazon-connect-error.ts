import { ProxyConnectionStatus, ProxySubjectStatus } from "./proxy";

export type AmazonConnectError = {
  message: string;
  key: string;
  isFatal: boolean;
  connectionStatus: ProxyConnectionStatus;
  proxyStatus: ProxySubjectStatus;
  details?: Record<string, unknown>;
};

export type AmazonConnectErrorHandler = (error: AmazonConnectError) => void;

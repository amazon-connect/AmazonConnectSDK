import { ProxyConnectionStatus } from "../proxy-connection";
import { ProxySubjectStatus } from "../proxy-subject-status";

export type UpstreamError = {
  message: string;
  key: string;
  isConnectionError: boolean;
  connectionStatus: ProxyConnectionStatus;
  proxyStatus: ProxySubjectStatus;
  details?: Record<string, unknown>;
};

export type UpstreamErrorHandler = (error: UpstreamError) => void;

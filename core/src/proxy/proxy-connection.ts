export type ProxyConnectionStatus =
  | "notConnected"
  | "connecting"
  | "initializing"
  | "ready"
  | "error";

export type ProxyConnectionEvent =
  | ProxyConnecting
  | ProxyInitializing
  | ProxyReady
  | ProxyError;

export type ProxyConnecting = {
  status: "connecting";
};

export type ProxyInitializing = {
  status: "initializing";
};

export type ProxyReady = {
  status: "ready";
};

export type ProxyError = {
  status: "error";
  reason: string;
  details?: Record<string, unknown>;
};

export type ProxyConnectionChangedHandler = (evt: ProxyConnectionEvent) => void;

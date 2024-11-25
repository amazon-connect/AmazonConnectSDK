export type ProxyConnectionStatus =
  | "notConnected"
  | "connecting"
  | "initializing"
  | "ready"
  | "error"
  | "reset";

export type ProxyConnectionEvent =
  | ProxyConnecting
  | ProxyInitializing
  | ProxyReady
  | ProxyError
  | ProxyReset;

export type ProxyConnecting = {
  status: "connecting";
};

export type ProxyInitializing = {
  status: "initializing";
};

export type ProxyReady = {
  status: "ready";
  connectionId: string;
};

export type ProxyError = {
  status: "error";
  reason: string;
  details?: Record<string, unknown>;
};

export type ProxyReset = {
  status: "reset";
  reason: string;
};

export type ProxyConnectionChangedHandler = (evt: ProxyConnectionEvent) => void;

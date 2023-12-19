import { ConnectLogger } from "../../logging";
import {
  ProxyConnectionChangedHandler,
  ProxyConnectionEvent,
  ProxyConnectionStatus,
} from "./types";

export class ProxyConnectionStatusManager {
  private readonly changeHandlers: Set<ProxyConnectionChangedHandler>;
  private readonly logger: ConnectLogger;
  private status: ProxyConnectionStatus;

  constructor() {
    this.status = "notConnected";
    this.changeHandlers = new Set();
    this.logger = new ConnectLogger({
      source: "core.proxy.connection-status-manager",
      mixin: () => ({ status: this.status }),
    });
  }

  getStatus(): ProxyConnectionStatus {
    return this.status;
  }

  update(evt: ProxyConnectionEvent): void {
    this.status = evt.status;
    this.logger.trace("Proxy Connection Status Changed", {
      status: evt.status,
    });
    [...this.changeHandlers].forEach((handler) => {
      try {
        handler(evt);
      } catch (error) {
        this.logger.error(
          "An error occurred within a ProxyConnectionChangedHandler",
          { error },
        );
      }
    });
  }

  onChange(handler: ProxyConnectionChangedHandler): void {
    this.changeHandlers.add(handler);
  }
  offChange(handler: ProxyConnectionChangedHandler): void {
    this.changeHandlers.delete(handler);
  }
}

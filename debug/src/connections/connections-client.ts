import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { debugNamespace } from "../debug-namespace";
import { getConnectionsRoute } from "../routes";
import { ConnectionData } from "./connection-data";

export class ConnectionsClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(debugNamespace, config);
  }

  async getConnections(): Promise<ConnectionData[]> {
    const result = await this.context.proxy.request<{
      connections: ConnectionData[];
    }>(getConnectionsRoute);

    return result.connections;
  }
}

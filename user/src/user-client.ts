import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { userNamespace } from "./namespace";

/**
 * Client for user-related operations in Amazon Connect.
 * Provides methods for retrieving user information and instance details.
 */
export class UserClient extends ConnectClient {
  constructor(config: ConnectClientConfig) {
    super(userNamespace, config);
  }
}

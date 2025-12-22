import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { userNamespace } from "./namespace";
import { UserRoutes } from "./routes";

/**
 * Client for user-related operations in Amazon Connect.
 * Provides methods for retrieving user information and instance details.
 */
export class UserClient extends ConnectClient {
  constructor(config: ConnectClientConfig) {
    super(userNamespace, config);
  }

  /**
   * Gets the active region of the user
   *
   * @returns A promise that resolves to the region string (e.g., "us-west-2", "us-east-1")
   *
   * @example
   * ```typescript
   * const region = await client.getUserRegion();
   * console.log(`User is in region: ${region}`);
   * ```
   */
  async getUserRegion(): Promise<string> {
    const { region } = await this.context.proxy.request<{
      region: string;
    }>(UserRoutes.getUserRegion);

    return region;
  }
}

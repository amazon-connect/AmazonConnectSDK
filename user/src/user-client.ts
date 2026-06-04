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
   */
  async getUserRegion(): Promise<string> {
    const { region } = await this.context.proxy.request<{
      region: string;
    }>(UserRoutes.getUserRegion);

    return region;
  }

  /**
   * Gets the ARN (Amazon Resource Name) of the currently authenticated user.
   *
   * @returns Promise resolving to the user's ARN
   */
  async getUserArn(): Promise<string> {
    const { userArn } = await this.context.proxy.request<{ userArn: string }>(
      UserRoutes.getUserArn,
    );

    return userArn;
  }

  /**
   * Gets the instance ID of the Amazon Connect instance for the current user.
   *
   * @returns Promise resolving to the instance ID
   */
  async getInstanceId(): Promise<string> {
    const { instanceId } = await this.context.proxy.request<{
      instanceId: string;
    }>(UserRoutes.getInstanceId);

    return instanceId;
  }
}

import { AppScope } from "@amazon-connect/workspace-types";

import { CoreLaunchOptions } from "./core-launch-options";

export interface AppLaunchOptions extends CoreLaunchOptions {
  /**
   * For apps associated with a contact, apply a specific scope. If not set
   * the app will be associated with the active contact. The launch will
   * error if the app is not associated with a contact.
   * @example
   * {
   *   type: "contact",
   *   contactId: "123"
   * }
   * @throws {ConnectError} Throws if the scope is not active or if the app is
   * not associated with a contact
   */
  scope?: AppScope;
}

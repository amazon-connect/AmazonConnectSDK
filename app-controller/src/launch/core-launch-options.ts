import { AppManagerData, AppParameters } from "@amazon-connect/workspace-types";

export interface CoreLaunchOptions {
  /**
   * JSON data passed to app. All data must be strings, numbers or boolean.
   * Nested data is allowed.
   * @example
   * {
   *   "caseId": 123,
   *   "priority": "high"
   * }
   */
  parameters?: AppParameters;

  /**
   * A caller generated value that prevents subsequent launch calls from
   * launching a new app when an app with the same launch key is starting
   * or running. All launch options are ignored when launchKey matches
   * an existing app. When not defined, a new app instance will be launched.
   * @example "my-app"
   */
  launchKey?: string;

  /**
   * When true, a newly started app will not be focused upon ready.
   */
  openInBackground?: boolean;

  /**
   * Data to be passed to the app manager. All data must be strings, numbers or
   * boolean. Nested data is allowed.
   * @example
   * {
   *   "appManagerData": {
   *     "location": "tab",
   *     "tabId": 1,
   *     "priority": "high"
   *   }
   * }
   */
  appManagerData?: AppManagerData;
}

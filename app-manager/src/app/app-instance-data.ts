import {
  AppConfig,
  AppManagerData,
  AppParameters,
  AppScope,
  LaunchSource,
} from "@amazon-connect/workspace-types";

import { InstanceData } from "../host";
import { AppScopeKey } from "./app-scope-key";

export type AppInstanceData<TConfig extends AppConfig = AppConfig> =
  InstanceData<TConfig> & {
    /**
     * @deprecated This property is deprecated. Use `instanceId` instead.
     */
    appInstanceId: string;

    /**
     * @deprecated This property is deprecated. Use `config` instead.
     */
    appConfig: TConfig;

    scope?: AppScope;
    scopeKey?: AppScopeKey;
    appCreateOrder: number;
    launchedBy: LaunchSource;
    parameters?: Readonly<AppParameters>;
    launchKey?: string;
    appManagerData?: Readonly<AppManagerData>;
    preventUserClose?: boolean;

    /**
     * @deprecated This property is deprecated. Use `launchedBy`. This
     * value will be removed after Agent Workspace is updated.
     */
    launchSource?: string;
  };

import { AppScopeAppUpdated } from "../../app-scope-events";
import {
  AppHostInScopeGroupDestroying,
  AppHostInScopeGroupDestroyingHandler,
} from "../../app-scope-group-events";
import { AppScopeAppChangedRelay } from "./app-scope-app-changed-relay";

export class AppScopeAppDestroyingRelay extends AppScopeAppChangedRelay<
  AppHostInScopeGroupDestroyingHandler,
  AppHostInScopeGroupDestroying
> {
  protected readonly updateType = "destroying";

  protected translate({
    scope,
    key,
    appInstanceId,
  }: AppScopeAppUpdated): Promise<AppHostInScopeGroupDestroying> {
    const scopeGroup = this.appScopeGroupStore.get({ scope, key });
    const appHost = this.getAppHost(appInstanceId);

    return Promise.resolve({
      appHost,
      scopeGroup,
    });
  }
}

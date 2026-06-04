import { AppScopeAppUpdated } from "../../app-scope-events";
import {
  AppHostInScopeGroupRemoved,
  AppHostInScopeGroupRemovedHandler,
} from "../../app-scope-group-events";
import { AppScopeAppChangedRelay } from "./app-scope-app-changed-relay";

export class AppScopeAppRemovedRelay extends AppScopeAppChangedRelay<
  AppHostInScopeGroupRemovedHandler,
  AppHostInScopeGroupRemoved
> {
  protected readonly updateType = "removed";

  protected translate({
    scope,
    key,
    appInstanceId,
  }: AppScopeAppUpdated): Promise<AppHostInScopeGroupRemoved> {
    const scopeGroup = this.appScopeGroupStore.get({ scope, key });

    return Promise.resolve({
      scopeGroup,
      appInstanceId,
    });
  }
}

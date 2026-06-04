import { AppScopeAppUpdated } from "../../app-scope-events";
import {
  AppHostInScopeGroupAdded,
  AppHostInScopeGroupAddedHandler,
} from "../../app-scope-group-events";
import { AppScopeAppChangedRelay } from "./app-scope-app-changed-relay";

export class AppScopeAppAddedRelay extends AppScopeAppChangedRelay<
  AppHostInScopeGroupAddedHandler,
  AppHostInScopeGroupAdded
> {
  protected readonly updateType = "added";

  protected translate({
    scope,
    key,
    appInstanceId,
  }: AppScopeAppUpdated): Promise<AppHostInScopeGroupAdded> {
    const scopeGroup = this.appScopeGroupStore.get({ scope, key });
    const appHost = this.getAppHost(appInstanceId);

    return Promise.resolve({
      appHost,
      scopeGroup,
    });
  }
}

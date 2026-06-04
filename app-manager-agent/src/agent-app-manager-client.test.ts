import {
  AppScopeKey,
  workspaceNamespace,
} from "@amazon-connect/app-manager";
import {
  isNoResultResponseError,
  ModuleContext,
  ModuleProxy,
} from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AgentAppManagerClient } from "./agent-app-manager-client";
import { ActiveContactRoutes, AppScopeRoutes } from "./routes";
import { AgentWorkspaceTopicKeys } from "./topic-keys";
import {
  ActiveContactId,
  AppScopeGroupData,
  GetScopeGroupOptions,
  GetScopeGroupsOptions,
  ModifyScopeGroupStateOptions,
  StartScopeResult,
} from "./types";

jest.mock("@amazon-connect/core/lib/request/no-result-error");

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});
let sut: AgentAppManagerClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AgentAppManagerClient({
    context: moduleContextMock,
  });
});

describe("constructor", () => {
  test("should set correct namespace", () => {
    expect(sut["namespace"]).toEqual(workspaceNamespace);
  });
});

describe("setActiveContact", () => {
  test("should set the active contact", async () => {
    const contactId = "contactId";

    await sut.setActiveContact(contactId);

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      ActiveContactRoutes.setActiveContact,
      { contactId },
    );
  });
});

describe("getActiveContact", () => {
  test("should get the active contact", async () => {
    const activeContact = mock<ActiveContactId>();

    moduleProxyMock.request.mockResolvedValueOnce(activeContact);

    const result = await sut.getActiveContact();

    expect(result).toEqual(activeContact);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      ActiveContactRoutes.getActiveContact,
    );
  });
});

describe("onActiveContactChanged", () => {
  test("should subscribe to active contact changed", () => {
    const handler = jest.fn();

    sut.onActiveContactChanged(handler);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      {
        key: AgentWorkspaceTopicKeys.activeContactChanged,
      },
      handler,
    );
  });
});

describe("offActiveContactChanged", () => {
  test("should unsubscribe to active contact changed", () => {
    const handler = jest.fn();

    sut.offActiveContactChanged(handler);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      {
        key: AgentWorkspaceTopicKeys.activeContactChanged,
      },
      handler,
    );
  });
});

describe("getScopeGroups", () => {
  test("should get scope groups with options", async () => {
    const scopeGroups = [mock<AppScopeGroupData>()];
    const options = mock<GetScopeGroupsOptions>();
    moduleProxyMock.request.mockResolvedValueOnce({ scopeGroups });

    const result = await sut.getScopeGroups(options);

    expect(result).toEqual(scopeGroups);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppScopeRoutes.getScopes,
      {
        options,
      },
    );
  });

  test("should get scope groups without options", async () => {
    const scopeGroups = [mock<AppScopeGroupData>()];
    moduleProxyMock.request.mockResolvedValueOnce({ scopeGroups });

    const result = await sut.getScopeGroups();

    expect(result).toEqual(scopeGroups);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppScopeRoutes.getScopes,
      {
        options: undefined,
      },
    );
  });
});

describe("getAppHost", () => {
  test("should get app host with options", async () => {
    const scope = mock<AppScope | AppScopeKey>();
    const scopeGroupData = mock<AppScopeGroupData>();
    const options = mock<GetScopeGroupOptions>();
    moduleProxyMock.request.mockResolvedValueOnce(scopeGroupData);

    const result = await sut.getScopeGroup(scope, options);

    expect(result).toEqual(scopeGroupData);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppScopeRoutes.getScope,
      {
        scope,
        options,
      },
    );
  });

  test("should get app host without options", async () => {
    const scope = mock<AppScope | AppScopeKey>();
    const scopeGroupData = mock<AppScopeGroupData>();
    moduleProxyMock.request.mockResolvedValueOnce(scopeGroupData);

    const result = await sut.getScopeGroup(scope);

    expect(result).toEqual(scopeGroupData);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppScopeRoutes.getScope,
      {
        scope,
        options: undefined,
      },
    );
  });

  test("should return undefined when no result", async () => {
    const scope = mock<AppScope | AppScopeKey>();
    const error = new Error("no result");
    moduleProxyMock.request.mockRejectedValueOnce(error);
    mocked(isNoResultResponseError).mockReturnValueOnce(true);

    const result = await sut.getScopeGroup(scope);

    expect(result).toBeUndefined();
    expect(isNoResultResponseError).toHaveBeenCalledWith(error);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppScopeRoutes.getScope,
      {
        scope,
        options: undefined,
      },
    );
  });

  test("should throw for other type of error", async () => {
    const scope = mock<AppScope | AppScopeKey>();
    const otherError = new Error("other error");
    moduleProxyMock.request.mockRejectedValueOnce(otherError);
    mocked(isNoResultResponseError).mockReturnValueOnce(false);

    try {
      await sut.getScopeGroup(scope);
    } catch (error) {
      expect(error).toEqual(otherError);
      expect(isNoResultResponseError).toHaveBeenCalledWith(error);
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        AppScopeRoutes.getScope,
        {
          scope,
          options: undefined,
        },
      );
    }

    expect.hasAssertions();
  });
});

describe("startScopeGroup", () => {
  test("should start scope group", async () => {
    const key = mock<AppScopeKey>();
    const options = mock<ModifyScopeGroupStateOptions>();
    const startScopeResult = mock<StartScopeResult>();
    moduleProxyMock.request.mockResolvedValueOnce(startScopeResult);

    const result = await sut.startScopeGroup(key, options);

    expect(result).toEqual(startScopeResult);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppScopeRoutes.startScope,
      {
        key,
        options,
      },
    );
  });
});

describe("stopScopeGroup", () => {
  test("should stop scope group", async () => {
    const key = mock<AppScopeKey>();
    const options = mock<ModifyScopeGroupStateOptions>();
    moduleProxyMock.request.mockResolvedValueOnce();

    await sut.stopScopeGroup(key, options);

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppScopeRoutes.stopScope,
      {
        key,
        options,
      },
    );
  });
});

describe("onAppScopeRemoved", () => {
  test("should subscribe to app scope removed event", () => {
    const handler = jest.fn();
    const appScope = mock<AppScopeKey>();

    sut.onAppScopeRemoved(handler, appScope);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      {
        key: AgentWorkspaceTopicKeys.appScopeGroupRemoved,
        parameter: appScope,
      },
      handler,
    );
  });
});

describe("offAppScopeRemoved", () => {
  test("should unsubscribe from app scope removed event", () => {
    const handler = jest.fn();
    const appScope = mock<AppScopeKey>();

    sut.offAppScopeRemoved(handler, appScope);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      {
        key: AgentWorkspaceTopicKeys.appScopeGroupRemoved,
        parameter: appScope,
      },
      handler,
    );
  });
});

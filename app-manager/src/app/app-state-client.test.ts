import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { ComponentState, CurrentState } from "../component-state";
import { AppInstanceRoutes } from "../routes";
import { StateChangeResult } from "../types";
import { workspaceNamespace } from "../workspace-namespace";
import { AppStateClient } from "./app-state-client";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});
let sut: AppStateClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AppStateClient({
    context: moduleContextMock,
  });
});

describe("constructor", () => {
  test("should set correct namespace", () => {
    expect(sut["namespace"]).toEqual(workspaceNamespace);
  });
});

describe("getState", () => {
  test("should get state", async () => {
    const appInstanceId = "app-instance-id";
    const state = mock<CurrentState>();
    moduleProxyMock.request.mockResolvedValueOnce(state);

    const result = await sut.getState(appInstanceId);

    expect(result).toEqual(state);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppInstanceRoutes.getState,
      {
        appInstanceId,
      },
    );
  });
});

describe("updateState", () => {
  test("should update state", async () => {
    const appInstanceId = "app-instance-id";
    const state: ComponentState = "running";
    const changeResult = mock<StateChangeResult>();
    moduleProxyMock.request.mockResolvedValueOnce(changeResult);

    const result = await sut.updateState(appInstanceId, state);

    expect(result).toEqual(changeResult);
    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AppInstanceRoutes.updateState,
      {
        appInstanceId,
        state,
      },
    );
  });
});

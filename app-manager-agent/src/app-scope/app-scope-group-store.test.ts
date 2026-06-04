import { AppHostStore, AppScopeKey } from "@amazon-connect/app-manager";
import { AmazonConnectProvider } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AgentAppManagerClient } from "../agent-app-manager-client";
import { AppScopeRemoved } from "./app-scope-events";
import { AppScopeGroup } from "./app-scope-group";
import { AppScopeGroupStore } from "./app-scope-group-store";
import { AppScopeGroupEventManager } from "./event-relay";

jest.mock("../agent-app-manager-client");
jest.mock("@amazon-connect/app-manager/lib/manager/app-host-store");
jest.mock("./app-scope-group");

jest.useFakeTimers();

const provider = mock<AmazonConnectProvider>();
const appHostStoreMock = mock<AppHostStore>();
const eventManagerMock = mock<AppScopeGroupEventManager>();

type ScopeTestData = { scope: AppScope; key: AppScopeKey };

const contactScope1: ScopeTestData = {
  scope: { type: "contact", contactId: "123" },
  key: "contact/123",
};
const contactScope2: ScopeTestData = {
  scope: { type: "contact", contactId: "456" },
  key: "contact/456",
};
const idleState: ScopeTestData = {
  scope: { type: "idle" },
  key: "idle",
};

let sut: AppScopeGroupStore;
let workspaceClientMock: MockedObject<AgentAppManagerClient>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AppScopeGroupStore({ provider, appHostStore: appHostStoreMock });

  workspaceClientMock = mocked(AgentAppManagerClient).mock.instances[0];
});

describe("constructor", () => {
  test("should create workspace client with provider", () => {
    expect(AgentAppManagerClient).toHaveBeenCalledTimes(1);
    expect(AgentAppManagerClient).toHaveBeenCalledWith({ provider });
  });
});

describe("init", () => {
  test("should set event manager", () => {
    sut.init(eventManagerMock);

    expect(sut["eventManager"]).toBe(eventManagerMock);
  });

  test("should throw when called subsequent times", () => {
    sut.init(eventManagerMock);

    try {
      sut.init(eventManagerMock);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect.hasAssertions();
  });
});

describe("get", () => {
  describe("when init has been called", () => {
    beforeEach(() => {
      sut.init(eventManagerMock);
    });

    describe("when the value does not currently exist", () => {
      test("should create a new group and store it", () => {
        const result = sut.get(contactScope1);

        expect(result).toBeInstanceOf(AppScopeGroup);
        expect(AppScopeGroup).toHaveBeenCalledTimes(1);
        expect(AppScopeGroup).toHaveBeenCalledWith({
          ...contactScope1,
          provider,
          appHostStore: appHostStoreMock,
          eventManager: eventManagerMock,
        });
        expect(sut["scopeGroups"].get(contactScope1.key)).toBe(result);
      });
    });

    describe("when the value already exists", () => {
      test("should return the existing group", () => {
        const expected = sut.get(contactScope1);
        mocked(AppScopeGroup).mockClear();

        const result = sut.get(contactScope1);

        expect(result).toBeInstanceOf(AppScopeGroup);
        expect(result).toEqual(expected);
        expect(AppScopeGroup).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe("when init has not been called", () => {
    test("should throw error", () => {
      try {
        sut.get(contactScope1);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(sut["scopeGroups"].size).toBe(0);
      }

      expect.hasAssertions();
    });
  });
});

describe("removeAppScope", () => {
  test("should remove the group from the store after delay", async () => {
    const [removeAppScopeAction] =
      workspaceClientMock.onAppScopeRemoved.mock.calls[0];
    sut.init(eventManagerMock);
    sut.get(contactScope1);
    const removeEvent = mock<AppScopeRemoved>({ key: contactScope1.key });

    const removePromise = removeAppScopeAction(removeEvent);

    await jest.advanceTimersByTimeAsync(3000);
    expect(sut["scopeGroups"].has(contactScope1.key)).toBeTruthy();
    await Promise.all([jest.runAllTimersAsync(), removePromise]);
    expect(sut["scopeGroups"].has(contactScope1.key)).toBeFalsy();
  });

  test("should not remove other scope", async () => {
    const [removeAppScopeAction] =
      workspaceClientMock.onAppScopeRemoved.mock.calls[0];
    sut.init(eventManagerMock);
    sut.get(contactScope1);
    sut.get(contactScope2);
    sut.get(idleState);
    const removeEvent = mock<AppScopeRemoved>({ key: contactScope1.key });

    const removePromise = removeAppScopeAction(removeEvent);

    await Promise.all([jest.runAllTimersAsync(), removePromise]);
    expect(sut["scopeGroups"].has(contactScope2.key)).toBeTruthy();
    expect(sut["scopeGroups"].has(idleState.key)).toBeTruthy();
    expect(sut["scopeGroups"].has(contactScope1.key)).toBeFalsy();
  });
});

describe("destroy", () => {
  test("should clear the store", () => {
    sut.init(eventManagerMock);
    sut.get(contactScope1);
    sut.destroy();

    expect(sut["scopeGroups"].size).toBe(0);
  });

  test("should unsubscribe to app scope removed", () => {
    const [removeAppScopeAction] =
      workspaceClientMock.onAppScopeRemoved.mock.calls[0];
    sut.init(eventManagerMock);
    expect(workspaceClientMock.offAppScopeRemoved).not.toHaveBeenCalled();

    sut.destroy();

    expect(workspaceClientMock.offAppScopeRemoved).toHaveBeenCalledWith(
      removeAppScopeAction,
    );
  });
});

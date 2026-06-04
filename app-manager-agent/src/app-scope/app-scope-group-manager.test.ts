import { AppHostStore } from "@amazon-connect/app-manager";
import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AgentAppManagerClient } from "../agent-app-manager-client";
import { AppScopeGroupData } from "../types";
import { AppScopeGroup } from "./app-scope-group";
import { AppScopeGroupManager } from "./app-scope-group-manager";
import { AppScopeGroupStore } from "./app-scope-group-store";
import { getContactScopeKey, idleScopeKey } from "./app-scope-key-values";
import { getContactToAppScopeGroupTranslator } from "./contact-to-app-scope-group-translator";
import { AppScopeGroupEventManager } from "./event-relay";
import {
  ContactScopeAddedRelay,
  ContactScopeDestroyingRelay,
  ContactScopeRemovedRelay,
} from "./event-relay/contact-scope-changed";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("../agent-app-manager-client");
jest.mock("./app-scope-group-store");
jest.mock("./event-relay/app-scope-group-event-manager");
jest.mock("./app-scope-key-values");
jest.mock("./contact-to-app-scope-group-translator");

const provider = mock<AmazonConnectProvider>();
const appHostStore = mock<AppHostStore>();
const mockContactToAppScopeGroupTranslator = jest.fn<
  AppScopeGroup,
  [string | null]
>();

let sut: AppScopeGroupManager;
let workspaceClientMock: MockedObject<AgentAppManagerClient>;
let appScopeGroupStoreMock: MockedObject<AppScopeGroupStore>;
let groupEventManagerMock: MockedObject<AppScopeGroupEventManager>;
let loggerMock: MockedObject<ConnectLogger>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  mocked(AppScopeGroupEventManager).mockImplementation(
    () =>
      ({
        contactScopeAddedRelay: mock<ContactScopeAddedRelay>(),
        contactScopeDestroyingRelay: mock<ContactScopeDestroyingRelay>(),
        contactScopeRemovedRelay: mock<ContactScopeRemovedRelay>(),
        destroy: jest.fn(),
      }) as unknown as MockedObject<AppScopeGroupEventManager>,
  );
  mocked(getContactToAppScopeGroupTranslator).mockReturnValueOnce(
    mockContactToAppScopeGroupTranslator,
  );

  sut = new AppScopeGroupManager({ provider, appHostStore });
  workspaceClientMock = mocked(AgentAppManagerClient).mock.instances[0];
  appScopeGroupStoreMock = mocked(AppScopeGroupStore).mock.instances[0];
  groupEventManagerMock = mocked(AppScopeGroupEventManager).mock.results[0]
    .value as MockedObject<AppScopeGroupEventManager>;
  loggerMock = mocked(ConnectLogger).mock.instances[0];
});

describe("constructor", () => {
  test("should create workspace client with provider", () => {
    expect(AgentAppManagerClient).toHaveBeenCalledTimes(1);
    expect(AgentAppManagerClient).toHaveBeenCalledWith({ provider });
  });

  test("should create app scope group store", () => {
    expect(AppScopeGroupStore).toHaveBeenCalledTimes(1);
    expect(AppScopeGroupStore).toHaveBeenCalledWith({
      provider,
      appHostStore,
    });
  });

  test("should create event manager", () => {
    expect(AppScopeGroupEventManager).toHaveBeenCalledTimes(1);
    expect(AppScopeGroupEventManager).toHaveBeenCalledWith({
      provider,
      appHostStore,
      appScopeGroupStore: appScopeGroupStoreMock,
    });
  });

  test("should init the scope group store with the event manager", () => {
    expect(appScopeGroupStoreMock.init).toHaveBeenCalledTimes(1);
    expect(appScopeGroupStoreMock.init).toHaveBeenCalledWith(
      groupEventManagerMock,
    );
  });

  test("should create ContactToAppScopeGroupTranslator with store", () => {
    expect(getContactToAppScopeGroupTranslator).toHaveBeenCalledTimes(1);
    expect(getContactToAppScopeGroupTranslator).toHaveBeenCalledWith({
      appScopeGroupStore: appScopeGroupStoreMock,
    });
  });
});

describe("getIdleGroup", () => {
  test("should return idle group", async () => {
    const idleData = mock<AppScopeGroupData>();
    const idleGroup = mock<AppScopeGroup>();
    workspaceClientMock.getScopeGroup.mockResolvedValueOnce(idleData);
    appScopeGroupStoreMock.get.mockReturnValueOnce(idleGroup);

    const result = await sut.getIdleGroup();

    expect(result).toEqual(idleGroup);
    expect(workspaceClientMock.getScopeGroup).toHaveBeenCalledWith(
      idleScopeKey,
    );
    expect(appScopeGroupStoreMock.get).toHaveBeenCalledWith(idleData);
    expect(loggerMock.error).not.toHaveBeenCalled();
  });

  test("should throw error when idle group not returned", async () => {
    workspaceClientMock.getScopeGroup.mockResolvedValueOnce(undefined);

    try {
      await sut.getIdleGroup();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(loggerMock.error).toHaveBeenCalled();
      expect(workspaceClientMock.getScopeGroup).toHaveBeenCalledWith(
        idleScopeKey,
      );
      expect(appScopeGroupStoreMock.get).not.toHaveBeenCalled();
    }

    expect.hasAssertions();
  });
});

describe("listContactGroups", () => {
  describe("when contact scope groups exist", () => {
    test("should return contact scope groups", async () => {
      const contactGroupData = [
        mock<AppScopeGroupData>({ key: "c1" }),
        mock<AppScopeGroupData>({ key: "c2" }),
        mock<AppScopeGroupData>({ key: "c3" }),
      ];
      workspaceClientMock.getScopeGroups.mockResolvedValueOnce(
        contactGroupData,
      );
      const contactGroup1 = mock<AppScopeGroup>();
      const contactGroup2 = mock<AppScopeGroup>();
      const contactGroup3 = mock<AppScopeGroup>();
      appScopeGroupStoreMock.get.mockImplementation(({ key }) => {
        switch (key) {
          case "c1":
            return contactGroup1;
          case "c2":
            return contactGroup2;
          case "c3":
            return contactGroup3;
          default:
            throw new Error("not found");
        }
      });

      const result = await sut.listContactGroups();

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([contactGroup1, contactGroup2, contactGroup3]),
      );
      expect(workspaceClientMock.getScopeGroups).toHaveBeenCalledWith({
        scopeTypeFilter: "contact",
      });
      expect(appScopeGroupStoreMock.get).toHaveBeenCalledTimes(3);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when no contact scope groups exist", () => {
    test("should return empty array", async () => {
      workspaceClientMock.getScopeGroups.mockResolvedValueOnce([]);

      const result = await sut.listContactGroups();

      expect(result).toHaveLength(0);
      expect(workspaceClientMock.getScopeGroups).toHaveBeenCalledWith({
        scopeTypeFilter: "contact",
      });
      expect(appScopeGroupStoreMock.get).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });
});

describe("getGroup", () => {
  describe("when the group exists", () => {
    test("should return the group by key", async () => {
      const key = "test-key";
      const groupData = mock<AppScopeGroupData>({ key });
      const group = mock<AppScopeGroup>();
      workspaceClientMock.getScopeGroup.mockResolvedValueOnce(groupData);
      appScopeGroupStoreMock.get.mockReturnValueOnce(group);

      const result = await sut.getGroup(key);

      expect(result).toEqual(group);
      expect(workspaceClientMock.getScopeGroup).toHaveBeenCalledWith(key);
      expect(appScopeGroupStoreMock.get).toHaveBeenCalledWith(groupData);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    test("should return the group by scope", async () => {
      const scope: AppScope = { type: "contact", contactId: "abc" };
      const groupData = mock<AppScopeGroupData>({ scope });
      const group = mock<AppScopeGroup>();
      workspaceClientMock.getScopeGroup.mockResolvedValueOnce(groupData);
      appScopeGroupStoreMock.get.mockReturnValueOnce(group);

      const result = await sut.getGroup(scope);

      expect(result).toEqual(group);
      expect(workspaceClientMock.getScopeGroup).toHaveBeenCalledWith(scope);
      expect(appScopeGroupStoreMock.get).toHaveBeenCalledWith(groupData);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the group does not exist", () => {
    test("should return undefined by key", async () => {
      const key = "test-key";
      workspaceClientMock.getScopeGroup.mockResolvedValueOnce(undefined);

      const result = await sut.getGroup(key);

      expect(result).toBeUndefined();
      expect(workspaceClientMock.getScopeGroup).toHaveBeenCalledWith(
        "test-key",
      );
      expect(appScopeGroupStoreMock.get).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    test("should return undefined by scope", async () => {
      const scope: AppScope = { type: "contact", contactId: "abc" };
      workspaceClientMock.getScopeGroup.mockResolvedValueOnce(undefined);

      const result = await sut.getGroup(scope);

      expect(result).toBeUndefined();
      expect(workspaceClientMock.getScopeGroup).toHaveBeenCalledWith(scope);
      expect(appScopeGroupStoreMock.get).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });
});

describe("getGroupFromContactId", () => {
  test("should get the scope group from the translator", () => {
    const testContactId = mock<string | null>();
    const scopeGroup = mock<AppScopeGroup>();
    mockContactToAppScopeGroupTranslator.mockReturnValueOnce(scopeGroup);

    const result = sut.getGroupFromContactId(testContactId);

    expect(result).toEqual(scopeGroup);
    expect(mockContactToAppScopeGroupTranslator).toHaveBeenCalledWith(
      testContactId,
    );
  });
});

describe("onContactGroupAdded", () => {
  test("should add handler", () => {
    const handler = jest.fn();

    sut.onContactGroupAdded(handler);

    expect(
      groupEventManagerMock.contactScopeAddedRelay.on,
    ).toHaveBeenCalledWith(handler);
  });
});

describe("offContactGroupAdded", () => {
  test("should remove handler", () => {
    const handler = jest.fn();

    sut.offContactGroupAdded(handler);

    expect(
      groupEventManagerMock.contactScopeAddedRelay.off,
    ).toHaveBeenCalledWith(handler);
  });
});

describe("onContactGroupDestroying", () => {
  test("should add handler when contact is defined", () => {
    const handler = jest.fn();
    const contact = "contact-1";
    const contactKey = "key-contact-1";
    mocked(getContactScopeKey).mockReturnValueOnce(contactKey);

    sut.onContactGroupDestroying(handler, contact);

    expect(
      groupEventManagerMock.contactScopeDestroyingRelay.on,
    ).toHaveBeenCalledWith(handler, contactKey);
    expect(getContactScopeKey).toHaveBeenCalledWith(contact);
  });

  test("should add handler when contact is not defined", () => {
    const handler = jest.fn();

    sut.onContactGroupDestroying(handler);

    expect(
      groupEventManagerMock.contactScopeDestroyingRelay.on,
    ).toHaveBeenCalledWith(handler, undefined);
    expect(getContactScopeKey).not.toHaveBeenCalled();
  });
});

describe("offContactGroupDestroying", () => {
  test("should remove handler when contact is defined", () => {
    const handler = jest.fn();
    const contact = "contact-1";
    const contactKey = "key-contact-1";
    mocked(getContactScopeKey).mockReturnValueOnce(contactKey);

    sut.offContactGroupDestroying(handler, contact);

    expect(
      groupEventManagerMock.contactScopeDestroyingRelay.off,
    ).toHaveBeenCalledWith(handler, contactKey);
    expect(getContactScopeKey).toHaveBeenCalledWith(contact);
  });

  test("should remove handler when contact is not defined", () => {
    const handler = jest.fn();

    sut.offContactGroupDestroying(handler);

    expect(
      groupEventManagerMock.contactScopeDestroyingRelay.off,
    ).toHaveBeenCalledWith(handler, undefined);
    expect(getContactScopeKey).not.toHaveBeenCalled();
  });
});

describe("onContactGroupRemoved", () => {
  test("should add handler when contact is defined", () => {
    const handler = jest.fn();
    const contact = "contact-1";
    const contactKey = "key-contact-1";
    mocked(getContactScopeKey).mockReturnValueOnce(contactKey);

    sut.onContactGroupRemoved(handler, contact);

    expect(
      groupEventManagerMock.contactScopeRemovedRelay.on,
    ).toHaveBeenCalledWith(handler, contactKey);
    expect(getContactScopeKey).toHaveBeenCalledWith(contact);
  });

  test("should add handler when contact is not defined", () => {
    const handler = jest.fn();

    sut.onContactGroupRemoved(handler);

    expect(
      groupEventManagerMock.contactScopeRemovedRelay.on,
    ).toHaveBeenCalledWith(handler, undefined);
    expect(getContactScopeKey).not.toHaveBeenCalled();
  });
});

describe("offContactGroupRemoved", () => {
  test("should remove handler when contact is defined", () => {
    const handler = jest.fn();
    const contact = "contact-1";
    const contactKey = "key-contact-1";
    mocked(getContactScopeKey).mockReturnValueOnce(contactKey);

    sut.offContactGroupRemoved(handler, contact);

    expect(
      groupEventManagerMock.contactScopeRemovedRelay.off,
    ).toHaveBeenCalledWith(handler, contactKey);
    expect(getContactScopeKey).toHaveBeenCalledWith(contact);
  });

  test("should remove handler when contact is not defined", () => {
    const handler = jest.fn();

    sut.offContactGroupRemoved(handler);

    expect(
      groupEventManagerMock.contactScopeRemovedRelay.off,
    ).toHaveBeenCalledWith(handler, undefined);
    expect(getContactScopeKey).not.toHaveBeenCalled();
  });
});

describe("destroy", () => {
  test("should destroy the event manager", () => {
    sut.destroy();

    expect(groupEventManagerMock.destroy).toHaveBeenCalledTimes(1);
  });
});

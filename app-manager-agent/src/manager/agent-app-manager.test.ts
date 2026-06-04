import {
  AppHost,
  AppHostStore,
  AppInstanceData,
} from "@amazon-connect/app-manager";
import { AmazonConnectProvider } from "@amazon-connect/core";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AgentAppManagerClient } from "../agent-app-manager-client";
import {
  AppScopeGroup,
  AppScopeGroupManager,
  ContactScopeGroup,
  getContactScopeKey,
  idleScopeKey,
} from "../app-scope";
import { ActiveContactId } from "../types";
import { AgentAppManager } from "./agent-app-manager";

jest.mock("../agent-app-manager-client");
jest.mock("../app-scope/app-scope-group-manager");
jest.mock("../app-scope/app-scope-key-values");

const provider = mock<AmazonConnectProvider>();
const appHostStoreMock = mock<AppHostStore>();
const getOrCreateAppHostMock = jest.fn<AppHost, [AppInstanceData]>();

let sut: AgentAppManager;
let workspaceClientMock: MockedObject<AgentAppManagerClient>;
let scopeManagerMock: MockedObject<AppScopeGroupManager>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AgentAppManager({
    provider,
    appHosts: appHostStoreMock,
    getOrCreateAppHost: getOrCreateAppHostMock,
  });
  workspaceClientMock = mocked(AgentAppManagerClient).mock.instances[0];
  scopeManagerMock = mocked(AppScopeGroupManager).mock.instances[0];
});

describe("constructor", () => {
  test("should create workspace client with provider", () => {
    expect(AgentAppManagerClient).toHaveBeenCalledTimes(1);
    expect(AgentAppManagerClient).toHaveBeenCalledWith({ provider });
  });

  test("should create app scope group manager", () => {
    expect(AppScopeGroupManager).toHaveBeenCalledTimes(1);
    expect(AppScopeGroupManager).toHaveBeenCalledWith({
      provider,
      appHostStore: appHostStoreMock,
    });
  });
});

describe("setActiveContact", () => {
  test("should set the active contact", async () => {
    const contactId = "contactId";

    await sut.setActiveContact(contactId);

    expect(workspaceClientMock.setActiveContact).toHaveBeenCalledWith(
      contactId,
    );
  });
});

describe("getActiveContact", () => {
  test("should get the active contact", async () => {
    const activeContact = mock<ActiveContactId>();

    workspaceClientMock.getActiveContact.mockResolvedValueOnce(activeContact);

    const result = await sut.getActiveContact();

    expect(result).toEqual(activeContact);
  });
});

describe("onActiveContactChanged", () => {
  test("should subscribe to active contact changed", () => {
    const handler = jest.fn();

    sut.onActiveContactChanged(handler);

    expect(workspaceClientMock.onActiveContactChanged).toHaveBeenCalledWith(
      handler,
    );
  });
});

describe("offActiveContactChanged", () => {
  test("should unsubscribe to active contact changed", () => {
    const handler = jest.fn();

    sut.offActiveContactChanged(handler);

    expect(workspaceClientMock.offActiveContactChanged).toHaveBeenCalledWith(
      handler,
    );
  });
});

describe("getIdleStateGroup", () => {
  test("should get idle state group", async () => {
    const idleStateGroup = mock<AppScopeGroup>();
    scopeManagerMock.getGroup.mockResolvedValueOnce(idleStateGroup);

    const result = await sut.getIdleStateGroup();

    expect(result).toBe(idleStateGroup);
    expect(scopeManagerMock.getGroup).toHaveBeenCalledWith(idleScopeKey);
  });

  test("should error if idle state group does not exist", async () => {
    scopeManagerMock.getGroup.mockResolvedValueOnce(undefined);

    try {
      await sut.getIdleStateGroup();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(scopeManagerMock.getGroup).toHaveBeenCalledWith(idleScopeKey);
    }
  });
});

describe("getContactGroups", () => {
  test("should get contact groups by contact id", async () => {
    const contactGroup1 = mock<ContactScopeGroup>({
      scope: { type: "contact", contactId: "c1" },
    });
    const contactGroup2 = mock<ContactScopeGroup>({
      scope: { type: "contact", contactId: "c2" },
    });
    const contactGroup3 = mock<ContactScopeGroup>({
      scope: { type: "contact", contactId: "c3" },
    });
    scopeManagerMock.listContactGroups.mockResolvedValueOnce([
      contactGroup1,
      contactGroup2,
      contactGroup3,
    ]);

    const result = await sut.getContactGroups();

    expect(result).toEqual({
      c1: contactGroup1,
      c2: contactGroup2,
      c3: contactGroup3,
    });
  });
});

describe("listContactGroups", () => {
  test("should list contact groups by contact id", async () => {
    const contactGroup1 = mock<ContactScopeGroup>({
      scope: { type: "contact", contactId: "c1" },
    });
    const contactGroup2 = mock<ContactScopeGroup>({
      scope: { type: "contact", contactId: "c2" },
    });
    const contactGroup3 = mock<ContactScopeGroup>({
      scope: { type: "contact", contactId: "c3" },
    });
    scopeManagerMock.listContactGroups.mockResolvedValueOnce([
      contactGroup1,
      contactGroup2,
      contactGroup3,
    ]);

    const result = await sut.listContactGroups();

    expect(result).toEqual({
      c1: contactGroup1,
      c2: contactGroup2,
      c3: contactGroup3,
    });
  });
});

describe("getContactGroup", () => {
  test("should get contact group when exists", async () => {
    const contactId = "contact-id";
    const contactKey = "contact-key";
    const contactGroup = mock<ContactScopeGroup>();
    mocked(getContactScopeKey).mockReturnValueOnce(contactKey);
    scopeManagerMock.getGroup.mockResolvedValueOnce(contactGroup);

    const result = await sut.getContactGroup(contactId);

    expect(result).toBe(contactGroup);
    expect(getContactScopeKey).toHaveBeenCalledWith(contactId);
    expect(scopeManagerMock.getGroup).toHaveBeenCalledWith(contactKey);
  });

  test("should get contact group when does not exist", async () => {
    const contactId = "contact-id";
    const contactKey = "contact-key";
    mocked(getContactScopeKey).mockReturnValueOnce(contactKey);
    scopeManagerMock.getGroup.mockResolvedValueOnce(undefined);

    const result = await sut.getContactGroup(contactId);

    expect(result).toBeUndefined();
    expect(getContactScopeKey).toHaveBeenCalledWith(contactId);
    expect(scopeManagerMock.getGroup).toHaveBeenCalledWith(contactKey);
  });
});

describe("onContactGroupAdded", () => {
  test("should add the handler", () => {
    const handler = jest.fn();

    sut.onContactGroupAdded(handler);

    expect(scopeManagerMock.onContactGroupAdded).toHaveBeenCalledWith(handler);
  });
});

describe("offContactGroupAdded", () => {
  test("should remove the handler", () => {
    const handler = jest.fn();

    sut.offContactGroupAdded(handler);

    expect(scopeManagerMock.offContactGroupAdded).toHaveBeenCalledWith(handler);
  });
});

describe("onContactGroupDestroying", () => {
  test("should add the handler", () => {
    const handler = jest.fn();
    const contact = "contact-id";

    sut.onContactGroupDestroying(handler, contact);

    expect(scopeManagerMock.onContactGroupDestroying).toHaveBeenCalledWith(
      handler,
      contact,
    );
  });
});

describe("offContactGroupDestroying", () => {
  test("should remove the handler", () => {
    const handler = jest.fn();
    const contact = "contact-id";

    sut.offContactGroupDestroying(handler, contact);

    expect(scopeManagerMock.offContactGroupDestroying).toHaveBeenCalledWith(
      handler,
      contact,
    );
  });
});

describe("onContactGroupRemoved", () => {
  test("should add the handler", () => {
    const handler = jest.fn();
    const contact = "contact-id";

    sut.onContactGroupRemoved(handler, contact);

    expect(scopeManagerMock.onContactGroupRemoved).toHaveBeenCalledWith(
      handler,
      contact,
    );
  });
});

describe("offContactGroupRemoved", () => {
  test("should remove the handler", () => {
    const handler = jest.fn();
    const contact = "contact-id";

    sut.offContactGroupRemoved(handler, contact);

    expect(scopeManagerMock.offContactGroupRemoved).toHaveBeenCalledWith(
      handler,
      contact,
    );
  });
});

describe("getActiveAppScopeGroup", () => {
  test("should get group group from active contact", async () => {
    const activeContactId = "test-active-contact-id";
    const scopeGroup = mock<AppScopeGroup>();
    workspaceClientMock.getActiveContact.mockResolvedValueOnce({
      activeContactId,
    });
    scopeManagerMock.getGroupFromContactId.mockReturnValueOnce(scopeGroup);

    const result = await sut.getActiveAppScopeGroup();

    expect(result).toEqual(scopeGroup);
    expect(scopeManagerMock.getGroupFromContactId).toHaveBeenCalledWith(
      activeContactId,
    );
  });
});

describe("onActiveAppScopeGroupChanged", () => {
  test("should add the handler", () => {
    const handler = jest.fn();

    sut.onActiveAppScopeGroupChanged(handler);

    expect(scopeManagerMock.onActiveAppScopeGroupChanged).toHaveBeenCalledWith(
      handler,
    );
  });
});

describe("offActiveAppScopeGroupChanged", () => {
  test("should remove the handler", () => {
    const handler = jest.fn();

    sut.offActiveAppScopeGroupChanged(handler);

    expect(scopeManagerMock.offActiveAppScopeGroupChanged).toHaveBeenCalledWith(
      handler,
    );
  });
});

import "./app-manager";

import { addAppManagerPluginKey } from "@amazon-connect/app-manager";
import { AppManager } from "@amazon-connect/app-manager";
import { AmazonConnectProvider } from "@amazon-connect/core";
import { MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ContactScopeGroup } from "../app-scope";
import { ActiveContactId } from "../types";
import { AgentAppManager } from "./agent-app-manager";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/emitter/async-event-emitter");
jest.mock("@amazon-connect/app-manager/lib/provider/provider-plugins");
jest.mock("@amazon-connect/app-manager/lib/app-manager-client");
jest.mock("@amazon-connect/app-manager/lib/manager/app-host-store");
jest.mock("./agent-app-manager");

afterEach(jest.resetAllMocks);

const provider = mock<AmazonConnectProvider>();

describe("Workspace plugin registration", () => {
  test("should register agent as plugin", () => {
    expect(addAppManagerPluginKey).toHaveBeenCalledTimes(1);
    expect(addAppManagerPluginKey).toHaveBeenCalledWith("agent");
  });
});

describe("AppManager", () => {
  let sut: AppManager;
  let agentAppManagerMock: MockedObject<AgentAppManager>;

  beforeEach(() => {
    sut = new AppManager({
      provider,
    });
    agentAppManagerMock = (
      sut as unknown as { agentAppManager: MockedObject<AgentAppManager> }
    ).agentAppManager;
  });

  describe("getActiveContact", () => {
    test("should return active contact id object", async () => {
      const activeContact = mock<ActiveContactId>({
        activeContactId: "contact-id",
      });
      agentAppManagerMock.getActiveContact.mockResolvedValueOnce(activeContact);

      const result = await sut.getActiveContact();

      expect(result).toBe(activeContact);
      expect(agentAppManagerMock.getActiveContact).toHaveBeenCalledTimes(1);
    });
  });

  describe("listContactGroups", () => {
    test("should get contact groups", async () => {
      const contactGroups = mock<Record<string, ContactScopeGroup>>();
      agentAppManagerMock.listContactGroups.mockResolvedValueOnce(
        contactGroups,
      );

      const result = await sut.listContactGroups();

      expect(result).toBe(contactGroups);
    });
  });

  describe("getContactGroup", () => {
    test("should get contact group", async () => {
      const contactId = "contact-id";
      const contactGroup = mock<ContactScopeGroup>();
      agentAppManagerMock.getContactGroup.mockResolvedValueOnce(contactGroup);

      const result = await sut.getContactGroup(contactId);

      expect(result).toBe(contactGroup);
      expect(agentAppManagerMock.getContactGroup).toHaveBeenCalledWith(
        contactId,
      );
    });
  });

  describe("onContactGroupAdded", () => {
    test("should add the handler", () => {
      const handler = jest.fn();

      sut.onContactGroupAdded(handler);

      expect(agentAppManagerMock.onContactGroupAdded).toHaveBeenCalledWith(
        handler,
      );
    });
  });

  describe("offContactGroupAdded", () => {
    test("should remove the handler", () => {
      const handler = jest.fn();

      sut.offContactGroupAdded(handler);

      expect(agentAppManagerMock.offContactGroupAdded).toHaveBeenCalledWith(
        handler,
      );
    });
  });

  describe("onContactGroupDestroying", () => {
    test("should remove the handler", () => {
      const handler = jest.fn();
      const contact = "contact-id";

      sut.onContactGroupDestroying(handler, contact);

      expect(agentAppManagerMock.onContactGroupDestroying).toHaveBeenCalledWith(
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

      expect(
        agentAppManagerMock.offContactGroupDestroying,
      ).toHaveBeenCalledWith(handler, contact);
    });
  });

  describe("onContactGroupRemoved", () => {
    test("should remove the handler", () => {
      const handler = jest.fn();
      const contact = "contact-id";

      sut.onContactGroupRemoved(handler, contact);

      expect(agentAppManagerMock.onContactGroupRemoved).toHaveBeenCalledWith(
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

      expect(agentAppManagerMock.offContactGroupRemoved).toHaveBeenCalledWith(
        handler,
        contact,
      );
    });
  });
});

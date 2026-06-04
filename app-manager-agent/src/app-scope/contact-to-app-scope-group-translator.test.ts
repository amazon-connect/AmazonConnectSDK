import { AppScopeKey } from "@amazon-connect/app-manager";
import { AppScope } from "@amazon-connect/workspace-types";
import { mock } from "jest-mock-extended";

import { AppScopeGroup } from "./app-scope-group";
import { AppScopeGroupStore } from "./app-scope-group-store";
import { getContactScopeKey, idleScopeKey } from "./app-scope-key-values";
import { ContactScopeGroup } from "./contact-scope-group";
import {
  ContactToAppScopeGroupTranslator,
  getContactToAppScopeGroupTranslator,
} from "./contact-to-app-scope-group-translator";

const mockAppScopeGroupStore = mock<AppScopeGroupStore>();

let sut: ContactToAppScopeGroupTranslator;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = getContactToAppScopeGroupTranslator({
    appScopeGroupStore: mockAppScopeGroupStore,
  });
});

describe("when the contact id is provided", () => {
  test("should return contact scope from store", () => {
    const testContactId = "test-contact-id";
    const contactScopeGroup = mock<ContactScopeGroup>();
    mockAppScopeGroupStore.get.mockReturnValueOnce(contactScopeGroup);
    const testContactScope: AppScope = {
      type: "contact",
      contactId: testContactId,
    };
    const testContactKey: AppScopeKey = getContactScopeKey(testContactId);

    const result = sut(testContactId);

    expect(result).toEqual(contactScopeGroup);
    expect(mockAppScopeGroupStore.get).toHaveBeenCalledWith({
      scope: testContactScope,
      key: testContactKey,
    });
  });
});

describe("when the contact id is null", () => {
  test("should provide the idle group from the store", () => {
    const idleGroup = mock<AppScopeGroup>();
    mockAppScopeGroupStore.get.mockReturnValueOnce(idleGroup);

    const result = sut(null);

    expect(result).toEqual(idleGroup);
    expect(mockAppScopeGroupStore.get).toHaveBeenCalledWith({
      scope: { type: "idle" },
      key: idleScopeKey,
    });
  });
});

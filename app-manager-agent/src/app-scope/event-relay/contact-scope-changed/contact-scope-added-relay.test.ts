import { AppScopeKey } from "@amazon-connect/app-manager";
import { AmazonConnectProvider, Proxy } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";
import { MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppScopeAdded, AppScopeAddedHandler } from "../../app-scope-events";
import { ContactScopeGroupAddedHandler } from "../../app-scope-group-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";
import { ContactScopeGroup } from "../../contact-scope-group";
import { ContactScopeAddedRelay } from "./contact-scope-added-relay";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const proxyMock = mock<Proxy>();
const provider = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});
const appScopeGroupStore = mock<AppScopeGroupStore>();
const contactScopeGroup = mock<ContactScopeGroup>();

beforeEach(jest.resetAllMocks);

describe("ContactScopeAddedRelay", () => {
  let sut: ContactScopeAddedRelay;
  const handler: MockedObject<ContactScopeGroupAddedHandler> = jest.fn();
  let internalHandler: AppScopeAddedHandler;

  beforeEach(() => {
    sut = new ContactScopeAddedRelay({
      provider,
      appScopeGroupStore,
    });

    sut.on(handler);
    internalHandler = proxyMock.subscribe.mock.calls[0][1];
  });

  test("should invoke handler for contact scope", async () => {
    const testContactScope: AppScope = { type: "contact", contactId: "foo" };
    const testContactKey: AppScopeKey = "contact/foo";
    const evt: AppScopeAdded = {
      scope: testContactScope,
      key: testContactKey,
    };
    appScopeGroupStore.get.mockReturnValueOnce(contactScopeGroup);

    await internalHandler(evt);

    expect(handler).toHaveBeenCalledWith({ scopeGroup: contactScopeGroup });
    expect(appScopeGroupStore.get).toHaveBeenCalledWith({
      scope: testContactScope,
      key: testContactKey,
    });
  });

  test("should not invoke handler for non-contact scope", async () => {
    const testIdleScope: AppScope = { type: "idle" };
    const testIdleKey: AppScopeKey = "idle";
    const evt: AppScopeAdded = {
      scope: testIdleScope,
      key: testIdleKey,
    };
    appScopeGroupStore.get.mockReturnValueOnce(contactScopeGroup);

    await internalHandler(evt);

    expect(handler).not.toHaveBeenCalled();
    expect(appScopeGroupStore.get).not.toHaveBeenCalled();
  });
});

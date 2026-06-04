import {
  AppHost,
  AppHostStore,
  AppScopeKey,
} from "@amazon-connect/app-manager";
import {
  AmazonConnectProvider,
  ConnectLogger,
  Proxy,
} from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import {
  AppScopeDestroying,
  AppScopeDestroyingHandler,
} from "../../app-scope-events";
import { ContactScopeGroupDestroyingHandler } from "../../app-scope-group-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";
import { ContactScopeGroup } from "../../contact-scope-group";
import { ContactScopeDestroyingRelay } from "./contact-scope-destroying-relay";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const proxyMock = mock<Proxy>();
const provider = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});
const appHostStore = mock<AppHostStore>();
const appScopeGroupStore = mock<AppScopeGroupStore>();
const contactScopeGroup = mock<ContactScopeGroup>();

beforeEach(jest.resetAllMocks);

describe("ContactScopeDestroyingRelay", () => {
  let sut: ContactScopeDestroyingRelay;
  const handler: MockedObject<ContactScopeGroupDestroyingHandler> = jest.fn();
  let internalHandler: AppScopeDestroyingHandler;
  let loggerMock: MockedObject<ConnectLogger>;

  beforeEach(() => {
    sut = new ContactScopeDestroyingRelay({
      provider,
      appScopeGroupStore,
      appHostStore,
    });

    sut.on(handler);
    internalHandler = proxyMock.subscribe.mock.calls[0][1];
    loggerMock = mocked(ConnectLogger).mock.instances[1];
  });

  test("should invoke handler for contact scope", async () => {
    const testContactScope: AppScope = { type: "contact", contactId: "foo" };
    const testContactKey: AppScopeKey = "contact/foo";
    const evt: AppScopeDestroying = {
      scope: testContactScope,
      key: testContactKey,
      destroyingAppInstanceIds: ["aa", "bb"],
      activeAppInstanceIds: ["zz"],
    };
    const hosts = [mock<AppHost>(), mock<AppHost>()];

    appScopeGroupStore.get.mockReturnValueOnce(contactScopeGroup);
    appHostStore.getBatch.mockReturnValueOnce({ hosts });

    await internalHandler(evt);

    expect(handler).toHaveBeenCalledWith({
      scopeGroup: contactScopeGroup,
      destroyingAppHosts: hosts,
    });
    expect(appHostStore.getBatch).toHaveBeenCalledWith(
      evt.destroyingAppInstanceIds,
    );
    expect(appScopeGroupStore.get).toHaveBeenCalledWith({
      scope: testContactScope,
      key: testContactKey,
    });
    expect(loggerMock.debug).not.toHaveBeenCalled();
  });

  test("should not invoke handler for non-contact scope", async () => {
    const testIdleScope: AppScope = { type: "idle" };
    const testIdleKey: AppScopeKey = "idle";
    const evt: AppScopeDestroying = {
      scope: testIdleScope,
      key: testIdleKey,
      destroyingAppInstanceIds: ["aa", "bb"],
      activeAppInstanceIds: ["zz"],
    };
    appScopeGroupStore.get.mockReturnValueOnce(contactScopeGroup);

    await internalHandler(evt);

    expect(handler).not.toHaveBeenCalled();
    expect(appHostStore.getBatch).not.toHaveBeenCalled();
    expect(appScopeGroupStore.get).not.toHaveBeenCalled();
    expect(loggerMock.debug).not.toHaveBeenCalled();
  });

  test("should log when one or more app hosts are not found", async () => {
    const testContactScope: AppScope = { type: "contact", contactId: "foo" };
    const testContactKey: AppScopeKey = "contact/foo";
    const evt: AppScopeDestroying = {
      scope: testContactScope,
      key: testContactKey,
      destroyingAppInstanceIds: ["aa", "bb", "mm"],
      activeAppInstanceIds: ["zz"],
    };
    const missingValues = ["mm"];
    const hosts = [mock<AppHost>(), mock<AppHost>()];

    appScopeGroupStore.get.mockReturnValueOnce(contactScopeGroup);
    appHostStore.getBatch.mockReturnValueOnce({ hosts, missingValues });

    await internalHandler(evt);

    expect(handler).toHaveBeenCalledWith({
      scopeGroup: contactScopeGroup,
      destroyingAppHosts: hosts,
    });
    expect(appHostStore.getBatch).toHaveBeenCalledWith(
      evt.destroyingAppInstanceIds,
    );
    expect(appScopeGroupStore.get).toHaveBeenCalledWith({
      scope: testContactScope,
      key: testContactKey,
    });
    expect(loggerMock.debug).toHaveBeenCalledWith(expect.any(String), {
      appInstanceIds: missingValues,
    });
  });
});

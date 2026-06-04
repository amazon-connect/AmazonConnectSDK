 
import { AmazonConnectProvider, Proxy } from "@amazon-connect/core";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import {
  ActiveContactChanged,
  ActiveContactChangedHandler,
} from "../../../types";
import { AppScopeGroup } from "../../app-scope-group";
import { ActiveAppScopeGroupChangedHandler } from "../../app-scope-group-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";
import { getContactToAppScopeGroupTranslator } from "../../contact-to-app-scope-group-translator";
import { ActiveScopedChangedRelay } from "./active-scope-changed-relay";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("../../contact-to-app-scope-group-translator");

const proxyMock = mock<Proxy>();
const provider = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});
const appScopeGroupStore = mock<AppScopeGroupStore>();
const mockContactToAppScopeGroupTranslator = jest.fn<
  AppScopeGroup,
  [string | null]
>();

beforeEach(jest.resetAllMocks);

describe("ActiveScopedChangedRelay", () => {
  let sut: ActiveScopedChangedRelay;
  const handler: MockedObject<ActiveAppScopeGroupChangedHandler> = jest.fn();
  let internalHandler: ActiveContactChangedHandler;

  beforeEach(() => {
    mocked(getContactToAppScopeGroupTranslator).mockReturnValueOnce(
      mockContactToAppScopeGroupTranslator,
    );

    sut = new ActiveScopedChangedRelay({
      provider,
      appScopeGroupStore,
    });

    sut.on(handler);
    internalHandler = proxyMock.subscribe.mock.calls[0][1];
  });

  test("should create ContactToAppScopeGroupTranslator with store", () => {
    expect(getContactToAppScopeGroupTranslator).toHaveBeenCalledTimes(1);
    expect(getContactToAppScopeGroupTranslator).toHaveBeenCalledWith({
      appScopeGroupStore,
    });
  });

  test("should invoke handler with translated app scope", async () => {
    const scopeGroup = mock<AppScopeGroup>();
    const testContactId = "test-contact-id";

    mockContactToAppScopeGroupTranslator.mockReturnValueOnce(scopeGroup);

    const evt: ActiveContactChanged = {
      activeContactId: testContactId,
    };
    appScopeGroupStore.get.mockReturnValueOnce(scopeGroup);

    await internalHandler(evt);

    expect(handler).toHaveBeenCalledWith({ scopeGroup: scopeGroup });
    expect(mockContactToAppScopeGroupTranslator).toHaveBeenCalledWith(
      testContactId,
    );
  });
});

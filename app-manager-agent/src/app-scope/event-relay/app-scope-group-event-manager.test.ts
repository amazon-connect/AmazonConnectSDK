import { AppHostStore } from "@amazon-connect/app-manager";
import { AmazonConnectProvider } from "@amazon-connect/core";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppScopeGroupStore } from "../app-scope-group-store";
import { ActiveScopedChangedRelay } from "./active-scope-changed";
import {
  AppScopeAppAddedRelay,
  AppScopeAppDestroyingRelay,
  AppScopeAppRemovedRelay,
} from "./app-changed";
import { AppScopeGroupEventManager } from "./app-scope-group-event-manager";
import {
  ContactScopeAddedRelay,
  ContactScopeDestroyingRelay,
  ContactScopeRemovedRelay,
} from "./contact-scope-changed";

jest.mock("./contact-scope-changed/contact-scope-added-relay");
jest.mock("./contact-scope-changed/contact-scope-destroying-relay");
jest.mock("./contact-scope-changed/contact-scope-removed-relay");
jest.mock("./active-scope-changed/active-scope-changed-relay");
jest.mock("./app-changed/app-scope-app-added-relay");
jest.mock("./app-changed/app-scope-app-destroying-relay");
jest.mock("./app-changed/app-scope-app-removed-relay");

const provider = mock<AmazonConnectProvider>();
const appHostStore = mock<AppHostStore>();
const appScopeGroupStore = mock<AppScopeGroupStore>();

let sut: AppScopeGroupEventManager;

let appAddedRelayMock: MockedObject<AppScopeAppAddedRelay>;
let appDestroyingRelayMock: MockedObject<AppScopeAppDestroyingRelay>;
let appRemovedRelayMock: MockedObject<AppScopeAppRemovedRelay>;

let contactScopeAddedRelayMock: MockedObject<ContactScopeAddedRelay>;
let contactScopeDestroyingRelayMock: MockedObject<ContactScopeDestroyingRelay>;
let contactScopeRemovedRelayMock: MockedObject<ContactScopeRemovedRelay>;

let activeScopeChangedRelayMock: MockedObject<ActiveScopedChangedRelay>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AppScopeGroupEventManager({
    provider,
    appHostStore,
    appScopeGroupStore,
  });

  appAddedRelayMock = mocked(AppScopeAppAddedRelay).mock.instances[0];
  appDestroyingRelayMock = mocked(AppScopeAppDestroyingRelay).mock.instances[0];
  appRemovedRelayMock = mocked(AppScopeAppRemovedRelay).mock.instances[0];

  contactScopeAddedRelayMock = mocked(ContactScopeAddedRelay).mock.instances[0];
  contactScopeDestroyingRelayMock = mocked(ContactScopeDestroyingRelay).mock
    .instances[0];
  contactScopeRemovedRelayMock = mocked(ContactScopeRemovedRelay).mock
    .instances[0];

  activeScopeChangedRelayMock = mocked(ActiveScopedChangedRelay).mock
    .instances[0];
});

describe("constructor", () => {
  test("should setup appAddedRelay", () => {
    expect(AppScopeAppAddedRelay).toHaveBeenCalledTimes(1);
    expect(AppScopeAppAddedRelay).toHaveBeenCalledWith({
      provider,
      appHostStore,
      appScopeGroupStore,
    });
    expect(sut.appAddedRelay).toEqual(appAddedRelayMock);
  });

  test("should setup appDestroyingRelay", () => {
    expect(AppScopeAppDestroyingRelay).toHaveBeenCalledTimes(1);
    expect(AppScopeAppDestroyingRelay).toHaveBeenCalledWith({
      provider,
      appHostStore,
      appScopeGroupStore,
    });
    expect(sut.appDestroyingRelay).toEqual(appDestroyingRelayMock);
  });

  test("should setup appRemovedRelay", () => {
    expect(AppScopeAppRemovedRelay).toHaveBeenCalledTimes(1);
    expect(AppScopeAppRemovedRelay).toHaveBeenCalledWith({
      provider,
      appHostStore,
      appScopeGroupStore,
    });
    expect(sut.appRemovedRelay).toEqual(appRemovedRelayMock);
  });

  test("should setup contactScopeAddedRelay", () => {
    expect(ContactScopeAddedRelay).toHaveBeenCalledTimes(1);
    expect(ContactScopeAddedRelay).toHaveBeenCalledWith({
      provider,
      appScopeGroupStore,
    });
    expect(sut.contactScopeAddedRelay).toEqual(contactScopeAddedRelayMock);
  });

  test("should setup contactScopeDestroyingRelay", () => {
    expect(ContactScopeDestroyingRelay).toHaveBeenCalledTimes(1);
    expect(ContactScopeDestroyingRelay).toHaveBeenCalledWith({
      provider,
      appHostStore,
      appScopeGroupStore,
    });
    expect(sut.contactScopeDestroyingRelay).toEqual(
      contactScopeDestroyingRelayMock,
    );
  });

  test("should setup contactScopeRemovedRelay", () => {
    expect(ContactScopeRemovedRelay).toHaveBeenCalledTimes(1);
    expect(ContactScopeRemovedRelay).toHaveBeenCalledWith({
      provider,
      appScopeGroupStore,
    });
    expect(sut.contactScopeRemovedRelay).toEqual(contactScopeRemovedRelayMock);
  });

  test("should setup activeScopeChangedRelay", () => {
    expect(ActiveScopedChangedRelay).toHaveBeenCalledTimes(1);
    expect(ActiveScopedChangedRelay).toHaveBeenCalledWith({
      provider,
      appScopeGroupStore,
    });
    expect(sut.activeScopeChangedRelay).toEqual(activeScopeChangedRelayMock);
  });
});

describe("destroy", () => {
  beforeEach(() => {
    sut.destroy();
  });

  test("should destroy appAddedRelay", () => {
    expect(appAddedRelayMock.destroy).toHaveBeenCalledTimes(1);
  });

  test("should destroy appDestroyingRelay", () => {
    expect(appDestroyingRelayMock.destroy).toHaveBeenCalledTimes(1);
  });

  test("should destroy appRemovedRelay", () => {
    expect(appRemovedRelayMock.destroy).toHaveBeenCalledTimes(1);
  });

  test("should destroy contactScopeAddedRelay", () => {
    expect(contactScopeAddedRelayMock.destroy).toHaveBeenCalledTimes(1);
  });

  test("should destroy contactScopeDestroyingRelay", () => {
    expect(contactScopeDestroyingRelayMock.destroy).toHaveBeenCalledTimes(1);
  });

  test("should destroy contactScopeRemovedRelay", () => {
    expect(contactScopeRemovedRelayMock.destroy).toHaveBeenCalledTimes(1);
  });

  test("should destroy activeScopeChangedRelay", () => {
    expect(activeScopeChangedRelayMock.destroy).toHaveBeenCalledTimes(1);
  });
});

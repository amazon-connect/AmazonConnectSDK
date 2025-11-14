import {
  AmazonConnectProvider,
  ModuleContext,
  ModuleProxy,
} from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { activityNamespace } from "./activity-namespace";
import { SessionExpirationWarningClient } from "./session-expiration-warning-client";
import { ActivityTopicKeys } from "./topic-keys";

const moduleProxyMock = mock<ModuleProxy>();
const providerMock = mock<AmazonConnectProvider>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
  getProvider: () => providerMock,
});
let sut: SessionExpirationWarningClient; 

beforeEach(() => {
  jest.resetAllMocks();

  sut = new SessionExpirationWarningClient({
    context: moduleContextMock,
  });
});

describe("constructor", () => {
  test("should set correct namespace", () => {
    expect(sut["namespace"]).toEqual(activityNamespace);
  });
});

describe("onExpirationWarning", () => {
  test("should subscribe to expirationWarning", () => {
    const handler = jest.fn();

    sut.onExpirationWarning(handler);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledTimes(1);
    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: ActivityTopicKeys.expirationWarning },
      handler,
    );
    expect(moduleProxyMock.unsubscribe).not.toHaveBeenCalled();
  });
});

describe("offExpirationWarning", () => {
  test("should unsubscribe to expirationWarning", () => {
    const handler = jest.fn();

    sut.offExpirationWarning(handler);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledTimes(1);
    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: ActivityTopicKeys.expirationWarning },
      handler,
    );
    expect(moduleProxyMock.subscribe).not.toHaveBeenCalled();
  });
});

describe("onExpirationWarningCleared", () => {
  test("should subscribe to expirationWarningCleared", () => {
    const handler = jest.fn();

    sut.onExpirationWarningCleared(handler);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledTimes(1);
    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: ActivityTopicKeys.expirationWarningCleared },
      handler,
    );
    expect(moduleProxyMock.unsubscribe).not.toHaveBeenCalled();
  });
});

describe("offExpirationWarningCleared", () => {
  test("should unsubscribe to expirationWarningCleared", () => {
    const handler = jest.fn();

    sut.offExpirationWarningCleared(handler);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledTimes(1);
    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: ActivityTopicKeys.expirationWarningCleared },
      handler,
    );
    expect(moduleProxyMock.subscribe).not.toHaveBeenCalled();
  });
});

describe("onSessionExtensionError", () => {
  test("should subscribe to sessionExtensionError", () => {
    const handler = jest.fn();

    sut.onSessionExtensionError(handler);

    expect(moduleProxyMock.subscribe).toHaveBeenCalledTimes(1);
    expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
      { key: ActivityTopicKeys.sessionExtensionError },
      handler,
    );
    expect(moduleProxyMock.unsubscribe).not.toHaveBeenCalled();
  });
});

describe("offSessionExtensionError", () => {
  test("should unsubscribe to sessionExtensionError", () => {
    const handler = jest.fn();

    sut.offSessionExtensionError(handler);

    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledTimes(1);
    expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
      { key: ActivityTopicKeys.sessionExtensionError },
      handler,
    );
    expect(moduleProxyMock.subscribe).not.toHaveBeenCalled();
  });
});

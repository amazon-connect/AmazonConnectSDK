import {
  AmazonConnectProvider,
  ConnectError,
  ConnectLogger,
  Proxy,
} from "@amazon-connect/core";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AppFocused, AppInstanceFocused } from "../app-event-types";
import { AppInstanceData } from "../app-instance-data";
import { AppFocusRelay } from "./app-focus-relay";
import { AppHost } from "./app-host";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const proxyMock = mock<Proxy>();
const providerMock = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});

const testInstanceId = "testInstanceId";
const appHost = mock<AppHost>({ instanceId: testInstanceId });

let sut: AppFocusRelay;
let loggerMock: MockedObject<ConnectLogger>;

beforeEach(jest.resetAllMocks);

describe("when instantiated with a host", () => {
  beforeEach(() => {
    sut = new AppFocusRelay({
      provider: providerMock,
      host: appHost as AppHost,
    });

    loggerMock = mocked(ConnectLogger).mock.instances[0];
  });

  test("should emit translated event with appHost", async () => {
    const handler = jest.fn();
    sut.on(handler, testInstanceId);
    const time = new Date().getTime();
    const appInstanceData = mock<AppInstanceData>({
      instanceId: testInstanceId,
    });

    const internalHandler = proxyMock.subscribe.mock.calls[0][1];

    const innerEvent: AppInstanceFocused = {
      ...appInstanceData,
      focusRequestTime: time,
    };
    const expected: AppFocused = {
      host: appHost,
      focusRequestTime: time,
    };

    await internalHandler(innerEvent);

    expect(handler).toHaveBeenCalledWith(expected);
    expect(loggerMock.error).not.toHaveBeenCalled();
  });

  test("should error when appHost mismatch", async () => {
    const handler = jest.fn();
    const altInstanceId = "alt-instance-id";
    sut.on(handler, altInstanceId);
    const time = new Date().getTime();
    const appInstanceData = mock<AppInstanceData>({
      instanceId: altInstanceId,
    });

    const internalHandler = proxyMock.subscribe.mock.calls[0][1];

    const innerEvent: AppInstanceFocused = {
      ...appInstanceData,
      focusRequestTime: time,
    };
    const expected: AppFocused = {
      host: appHost,
      focusRequestTime: time,
    };

    await internalHandler(innerEvent);

    expect(handler).not.toHaveBeenCalledWith(expected);
    expect(loggerMock.error).toHaveBeenCalledWith(
      "An error occurred when translating event",
      {
        error: expect.any(ConnectError) as ConnectError,
        parameter: altInstanceId,
      },
    );
    const error = loggerMock.error.mock.calls[0][1]!.error as ConnectError;
    expect(error.errorKey).toEqual("focusAppHostMismatch");
    expect(error.details).toEqual({
      eventInstanceId: altInstanceId,
      appHostInstanceId: testInstanceId,
    });
  });
});

describe("when instantiated with a getHost", () => {
  beforeEach(() => {
    sut = new AppFocusRelay({
      provider: providerMock,
      getHost: (instanceId) =>
        instanceId === testInstanceId ? appHost : undefined,
    });

    loggerMock = mocked(ConnectLogger).mock.instances[0];
  });

  test("should emit translated event with appHost", async () => {
    const handler = jest.fn();
    sut.on(handler);
    const time = new Date().getTime();
    const appInstanceData = mock<AppInstanceData>({
      instanceId: testInstanceId,
    });

    const internalHandler = proxyMock.subscribe.mock.calls[0][1];

    const innerEvent: AppInstanceFocused = {
      ...appInstanceData,
      focusRequestTime: time,
    };
    const expected: AppFocused = {
      host: appHost,
      focusRequestTime: time,
    };

    await internalHandler(innerEvent);

    expect(handler).toHaveBeenCalledWith(expected);
    expect(loggerMock.error).not.toHaveBeenCalled();
  });

  test("should error when appHost app host not found", async () => {
    const handler = jest.fn();
    const altInstanceId = "alt-instance-id";
    sut.on(handler);
    const time = new Date().getTime();
    const appInstanceData = mock<AppInstanceData>({
      instanceId: altInstanceId,
    });

    const internalHandler = proxyMock.subscribe.mock.calls[0][1];

    const innerEvent: AppInstanceFocused = {
      ...appInstanceData,
      focusRequestTime: time,
    };
    const expected: AppFocused = {
      host: appHost,
      focusRequestTime: time,
    };

    await internalHandler(innerEvent);

    expect(handler).not.toHaveBeenCalledWith(expected);
    expect(loggerMock.error).toHaveBeenCalledWith(
      "An error occurred when translating event",
      {
        error: expect.any(ConnectError) as ConnectError,
        parameter: undefined,
      },
    );
    const error = loggerMock.error.mock.calls[0][1]!.error as ConnectError;
    expect(error.errorKey).toEqual("focusAppNotFound");
    expect(error.details).toEqual({
      instanceId: altInstanceId,
    });
  });
});

import {
  AmazonConnectProvider,
  ConnectLogger,
  Proxy,
} from "@amazon-connect/core";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { activityNamespace } from "./activity-namespace";
import { ActivityRoutes } from "./routes";
import { sendActivity } from "./send-activity-callback";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const proxyMock = mock<Proxy>({
  request: jest.fn().mockResolvedValue({}),
});
const providerMock = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});

let activitySut: () => void;
let loggerMock: MockedObject<ConnectLogger>;

beforeEach(() => {
  jest.resetAllMocks();

  activitySut = () => sendActivity(providerMock);
});

describe("sendActivity", () => {
  beforeEach(() => {
    proxyMock.request.mockClear();
    jest.useFakeTimers();
    jest.advanceTimersByTime(1000);
  });

  afterEach(() => {
    jest.runAllTimers();
  });

  test("should create a logger once", async () => {
    activitySut();
    await Promise.resolve();
    jest.runAllTimers();
    loggerMock = mocked(ConnectLogger).mock.instances[0];

    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(ConnectLogger).toHaveBeenCalledWith({
      provider: providerMock,
      source: activityNamespace,
    });
    expect(loggerMock.debug).toHaveBeenCalledWith(
      "Creating activity callback..",
    );

    jest.advanceTimersByTime(1000);
    activitySut();
    await Promise.resolve();
    jest.runAllTimers();
    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
  });

  test("should log errors if an error occurs", async () => {
    const testError = new Error("tesitng");
    proxyMock.request.mockRejectedValue(testError);

    activitySut();
    await Promise.resolve();
    jest.runAllTimers();

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenCalledWith(
      "Failed to record agent activity",
      {
        error: testError,
        errorCount: 0,
      },
    );
  });

  test("invoking the function multiple times should result in 1 request", async () => {
    proxyMock.request.mockResolvedValue();
    jest.advanceTimersByTime(1000);

    for (let i = 0; i < 7; i++) {
      activitySut();
    }

    await Promise.resolve();
    jest.runAllTimers();

    expect(proxyMock.request).toHaveBeenCalledTimes(1);
    expect(proxyMock.request).toHaveBeenCalledWith(
      activityNamespace,
      ActivityRoutes.sendActivity,
    );
  });

  test("should only log errors up to 5 times", async () => {
    const testError = new Error("error");
    proxyMock.request.mockRejectedValue(testError);

    for (let i = 0; i < 7; i++) {
      activitySut();
      await Promise.resolve();
      jest.runAllTimers();
    }

    expect(loggerMock.error).toHaveBeenCalledTimes(5);
    expect(loggerMock.error).toHaveBeenNthCalledWith(
      5,
      "Failed to record agent activity",
      {
        error: testError,
        errorCount: 4,
      },
    );
  });
});

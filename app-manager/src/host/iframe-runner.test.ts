import {
  AmazonConnectProvider,
  ConnectLogger,
  LogLevel,
} from "@amazon-connect/core";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ComponentState } from "../component-state";
import { StateChangeResult, StateFailReason } from "../types";
import { HostStateManager } from "./host-state-manager";
import {
  IFrameConfig,
  IFrameRunner,
  IFrameRunnerParams,
} from "./iframe-runner";
import { linkConnection } from "./link-connection";
import { isSupportedAppSource } from "./supported-app-sources";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/request/no-result-error");
jest.mock("./link-connection");
jest.useFakeTimers();

type MessageEventWithType = MessageEvent<{ type?: string; source?: string }>;

const testArn = "arn";
const testName = "name";
const testInstanceId = "instance-id";
const accessUrl = "http://test.com/iframe.html";
const config = mock<IFrameConfig>({
  arn: testArn,
  name: testName,
  accessUrl,
});
const connectionId = "connection-id";

const provider = mock<AmazonConnectProvider>();
const mockHostStateManager = mock<HostStateManager>();
let sut: IFrameRunner;
let loggerMock: MockedObject<ConnectLogger>;

const windowMock = mock<Window & typeof globalThis>();

const contentWindow = { name: "parentWindow" } as Window;

beforeAll(() => {
  global.window = windowMock;
});

beforeEach(jest.resetAllMocks);
beforeEach(jest.clearAllTimers);

const createSut = (accessUrl?: string) => {
  mocked(ConnectLogger).mockReset();
  mocked(window.addEventListener).mockReset();
  const params: IFrameRunnerParams = {
    provider,
    instanceId: testInstanceId,
    connectionId,
    config: mock<IFrameConfig>({
      ...config,
      accessUrl: accessUrl ?? config.accessUrl,
    }),
    hostStateManager: mockHostStateManager,
  };

  const sut = new IFrameRunner(params);

  return {
    sut,
    loggerMock: mocked(ConnectLogger).mock.instances[0],
  };
};

beforeEach(() => {
  ({ sut, loggerMock } = createSut());
});

describe("constructor", () => {
  test("should configure logger mixin to include app info", () => {
    const loggerConfig = mocked(ConnectLogger).mock.calls[0][0];
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.instanceId).toEqual(testInstanceId);
    expect(result.appName).toEqual(testName);
    expect(result.arn).toEqual(testArn);
    expect(result.connectionId).toEqual(connectionId);
  });
});

describe("setIFrame", () => {
  beforeEach(() => {
    // Always set updateStatus result to true
    mockHostStateManager.updateState.mockResolvedValueOnce(
      mock<StateChangeResult>({ success: true }),
    );
  });

  test("should set iframe on AppHost", () => {
    const testIframe = mock<HTMLIFrameElement>();
    sut.setIFrame(testIframe);

    expect(sut.iframe).toEqual(testIframe);
    expect(loggerMock.info).toHaveBeenCalledWith(
      "Setting iframe with IFrame Runner",
    );
  });

  test("should set loading status", () => {
    const testIframe = mock<HTMLIFrameElement>();
    sut.setIFrame(testIframe);

    expect(mockHostStateManager.updateState).toHaveBeenCalledWith("loading");
  });

  test("should add window listener after setting iframe and setting loading", () => {
    const testIframe = mock<HTMLIFrameElement>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    windowMock.addEventListener.mockImplementationOnce((type: any) => {
      expect(type).toEqual("message");
      expect(mockHostStateManager.updateState).toHaveBeenCalledWith("loading");
    });

    sut.setIFrame(testIframe);

    expect.hasAssertions();
  });

  test("should set iframe source", () => {
    const testIframe = mock<HTMLIFrameElement>();
    sut.setIFrame(testIframe);

    expect(testIframe.src).toEqual(accessUrl);
  });

  test("should set on loaded event to set to loaded", () => {
    const testIframe = mock<HTMLIFrameElement>();
    testIframe.onload = null;

    sut.setIFrame(testIframe);

    expect(testIframe.onload).not.toBeNull();
    mockHostStateManager.updateState.mockClear();
    mockHostStateManager.updateState.mockResolvedValueOnce(
      mock<StateChangeResult>({ success: true }),
    );
    (testIframe.onload as unknown as () => void)();
    expect(mockHostStateManager.updateState).toHaveBeenCalledTimes(1);
    expect(mockHostStateManager.updateState).toHaveBeenCalledWith("loaded");
  });

  test("should not set iframe data before applying listener", () => {
    const testIframe = mock<HTMLIFrameElement>();
    windowMock.addEventListener.mockImplementationOnce(() => {
      expect(testIframe.src).not.toEqual(accessUrl);
    });

    sut.setIFrame(testIframe);

    expect.hasAssertions();
  });

  test("should log error and throw when adding iframe a second time", () => {
    const testIframe = mock<HTMLIFrameElement>();
    const originalIframe = mock<HTMLIFrameElement>();

    sut.setIFrame(originalIframe);
    loggerMock.error.mockReset();
    mockHostStateManager.updateState.mockReset();

    try {
      sut.setIFrame(testIframe);
    } catch (error) {
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String));
      expect(error).toBeInstanceOf(Error);
      expect(mockHostStateManager.updateState).not.toHaveBeenCalled();
    }

    expect.hasAssertions();
  });
});

describe("listenForInitialMessage", () => {
  describe("when the iframe is set", () => {
    let handler: (evt: MessageEventWithType) => void;
    const testIframe = {
      contentWindow: contentWindow,
    } as HTMLIFrameElement;

    beforeEach(() => {
      mockHostStateManager.updateState.mockResolvedValueOnce(
        mock<StateChangeResult>({ success: true }),
      );
      sut.setIFrame(testIframe);

      handler = mocked(window.addEventListener).mock.calls[0][1] as (
        evt: MessageEventWithType,
      ) => void;
    });

    describe("when the event source does not match window", () => {
      test("should take no action", () => {
        const testEvent = {
          source: {} as Window,
          origin: "invalid-format-origin",
        } as MessageEventWithType;

        handler(testEvent);

        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(linkConnection).not.toHaveBeenCalled();
      });
    });

    describe("when the origin is not defined", () => {
      test("should warn and not take an action", () => {
        const testEvent = {
          source: contentWindow,
          origin: undefined as unknown as string,
        } as MessageEventWithType;

        handler(testEvent);

        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
        expect(linkConnection).not.toHaveBeenCalled();
      });
    });

    describe("when the origin of iframe is not valid", () => {
      test("should warn and not take an action", () => {
        const invalidUrl = "invalidUrl";
        const { sut, loggerMock } = createSut(invalidUrl);
        mockHostStateManager.updateState.mockResolvedValueOnce(
          mock<StateChangeResult>({ success: true }),
        );
        sut.setIFrame(testIframe);
        handler = mocked(window.addEventListener).mock.calls[0][1] as (
          evt: MessageEventWithType,
        ) => void;

        const testEvent = {
          source: contentWindow,
          origin: "http://test.com",
        } as MessageEventWithType;

        handler(testEvent);

        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String), {
          appLocation: invalidUrl,
          eventOrigin: testEvent.origin,
          error: expect.anything() as Error,
        });
        expect(linkConnection).not.toHaveBeenCalled();
      });
    });

    describe("when the event source is not valid", () => {
      test("should warn and not take an action", () => {
        const invalidOrigin = "http://invalid.com";
        const testEvent = {
          source: contentWindow,
          origin: invalidOrigin,
        } as MessageEventWithType;

        handler(testEvent);

        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String), {
          expectedOrigin: "http://test.com",
          eventOrigin: invalidOrigin,
        });
        expect(linkConnection).not.toHaveBeenCalled();
      });
    });

    describe("when the event source and origin are valid", () => {
      describe("when the event data type is not connect-app-host-init", () => {
        test("should warn and not take an action", () => {
          const testEvent = {
            data: { type: "invalid-type" },
            source: contentWindow,
            origin: new URL(accessUrl).origin,
          } as MessageEventWithType;

          handler(testEvent);

          expect(loggerMock.warn).toHaveBeenCalledTimes(1);
          expect(loggerMock.warn).toHaveBeenCalledWith(
            "Unexpected PostMessage from iframe. No action",
            {
              msg: testEvent.data,
              unexpectedPostMessageCount: 1,
            },
          );
          expect(linkConnection).not.toHaveBeenCalled();
        });
      });

      describe("when the data type is connect-app-host-init", () => {
        describe("when the message port is not set", () => {
          test("should throw error", () => {
            const testEvent = {
              data: { type: "connect-app-host-init" },
              source: contentWindow,
              origin: new URL(accessUrl).origin,
              ports: [] as unknown,
            } as MessageEventWithType;
            try {
              handler(testEvent);
            } catch (error) {
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toEqual(
                "message port not found on event",
              );
            }

            expect.hasAssertions();
          });
        });

        describe("when establishing initial connection", () => {
          const mockMessagePort = mock<MessagePort>();
          const testEvent = {
            data: { type: "connect-app-host-init" },
            source: contentWindow,
            origin: new URL(accessUrl).origin,
            ports: [mockMessagePort] as unknown,
          } as MessageEventWithType;

          beforeEach(() => {
            mockHostStateManager.updateState.mockReset();
            mockHostStateManager.updateState.mockResolvedValueOnce(
              mock<StateChangeResult>({ success: true }),
            );
          });

          describe("when the event meets all requirements", () => {
            test("should link app connection", async () => {
              handler(testEvent);

              // This code is testing an linkConnection wrapped in a fire and
              // forget promise being invoked. There is no way to await this directly
              // so this loop will wait to the condition is met (or the test would
              // fail if condition is not met because of the timeout)
              while (mocked(linkConnection).mock.calls.length === 0) {
                await new Promise(process.nextTick);
              }

              expect(linkConnection).toHaveBeenCalledTimes(1);
              expect(linkConnection).toHaveBeenCalledWith({
                instanceId: testInstanceId,
                connectionId,
                provider,
                port: mockMessagePort,
                hostInitMessage: testEvent.data,
                isRestart: false,
              });
            });

            test("should update status to connected after linking", async () => {
              mockHostStateManager.updateState.mockReset();
              mockHostStateManager.updateState.mockImplementationOnce(
                (state) => {
                  // Only one call ensures restarted was not called
                  expect(state).toEqual("connected");
                  expect(linkConnection).toHaveBeenCalled();
                  return Promise.resolve(
                    mock<StateChangeResult>({ success: true }),
                  );
                },
              );

              handler(testEvent);

              // This code is testing an linkConnection wrapped in a fire and
              // forget promise being invoked. There is no way to await this directly
              // so this loop will wait to the condition is met (or the test would
              // fail if condition is not met because of the timeout)
              while (mockHostStateManager.updateState.mock.calls.length === 0) {
                await new Promise(process.nextTick);
              }

              expect.hasAssertions();
            });
          });

          describe("when restarting connection", () => {
            beforeEach(() => {
              sut["messagePort"] = mock<MessagePort>();
            });

            describe("when the restart succeeds", () => {
              beforeEach(() => {
                mockHostStateManager.updateState.mockReset();
              });

              test("should reset unexpectedPostMessageCount to 0 during restart", async () => {
                sut["unexpectedPostMessageCount"] = 10;
                mockHostStateManager.updateState.mockResolvedValue(
                  mock<StateChangeResult>({ success: true }),
                );

                await sut["restart"]();

                expect(sut["unexpectedPostMessageCount"]).toEqual(0);
              });

              test("should call restart", async () => {
                mockHostStateManager.updateState
                  .mockImplementationOnce((state) => {
                    // Only one call ensures restarted was not called
                    expect(state).toEqual("restarting");
                    expect(linkConnection).not.toHaveBeenCalled();
                    return Promise.resolve(
                      mock<StateChangeResult>({ success: true }),
                    );
                  })
                  .mockResolvedValue(
                    mock<StateChangeResult>({ success: true }),
                  );

                handler(testEvent);

                // This code is testing an linkConnection wrapped in a fire and
                // forget promise being invoked. There is no way to await this directly
                // so this loop will wait to the condition is met (or the test would
                // fail if condition is not met because of the timeout)
                while (mockHostStateManager.updateState.mock.calls.length > 1) {
                  await new Promise(process.nextTick);
                }

                expect.hasAssertions();
              });

              test("should link app after restart", async () => {
                mockHostStateManager.updateState.mockResolvedValue(
                  mock<StateChangeResult>({ success: true }),
                );
                mocked(linkConnection).mockImplementationOnce((args) => {
                  expect(args).toEqual({
                    instanceId: testInstanceId,
                    connectionId,
                    provider,
                    port: mockMessagePort,
                    hostInitMessage: testEvent.data,
                    isRestart: true,
                  });
                  expect(mockHostStateManager.updateState).toHaveBeenCalledWith(
                    "restarting",
                  );
                });

                handler(testEvent);

                // This code is testing an linkConnection wrapped in a fire and
                // forget promise being invoked. There is no way to await this directly
                // so this loop will wait to the condition is met (or the test would
                // fail if condition is not met because of the timeout)
                while (mockHostStateManager.updateState.mock.calls.length > 1) {
                  await new Promise(process.nextTick);
                }

                expect.hasAssertions();
              });

              test("should update state connected after linkConnection", async () => {
                mockHostStateManager.updateState
                  .mockResolvedValueOnce(
                    mock<StateChangeResult>({ success: true }),
                  )
                  .mockImplementationOnce((state) => {
                    // Only one call ensures restarted was not called
                    expect(state).toEqual("connected");
                    expect(linkConnection).toHaveBeenCalledTimes(1);
                    return Promise.resolve(
                      mock<StateChangeResult>({ success: true }),
                    );
                  });

                handler(testEvent);

                // This code is testing an linkConnection wrapped in a fire and
                // forget promise being invoked. There is no way to await this directly
                // so this loop will wait to the condition is met (or the test would
                // fail if condition is not met because of the timeout)
                while (mockHostStateManager.updateState.mock.calls.length > 1) {
                  await new Promise(process.nextTick);
                }

                expect.hasAssertions();
              });
            });

            describe("when the restart failed once and then succeeds", () => {
              const testInitialFailReason = mock<StateFailReason>();
              const testPreState = mock<ComponentState>();
              beforeEach(() => {
                mockHostStateManager.updateState.mockReset();
                mockHostStateManager.updateState
                  .mockResolvedValueOnce(
                    mock<StateChangeResult>({
                      success: false,
                      state: testPreState,
                      reason: testInitialFailReason,
                    }),
                  )
                  .mockResolvedValue(
                    mock<StateChangeResult>({ success: true }),
                  );
              });

              test("should call update state restarting two times, then connected", async () => {
                handler(testEvent);
                await jest.runAllTimersAsync();

                expect(mockHostStateManager.updateState).toHaveBeenCalledTimes(
                  3,
                );
                expect(
                  mockHostStateManager.updateState.mock.calls[0][0],
                ).toEqual("restarting");
                expect(
                  mockHostStateManager.updateState.mock.calls[1][0],
                ).toEqual("restarting");
                expect(
                  mockHostStateManager.updateState.mock.calls[2][0],
                ).toEqual("connected");
              });

              test("should log warning with first result", async () => {
                handler(testEvent);
                await jest.runAllTimersAsync();

                expect(loggerMock.warn).toHaveBeenCalledWith(
                  expect.any(String),
                  {
                    reason: testInitialFailReason,
                    state: testPreState,
                  },
                );
              });

              test("should not call error", async () => {
                handler(testEvent);
                await jest.runAllTimersAsync();

                expect(loggerMock.error).not.toHaveBeenCalled();
              });

              test("should link connection after retry", (callback) => {
                loggerMock.warn.mockImplementationOnce(() => {
                  void jest.runAllTimersAsync().then(() => {
                    expect(linkConnection).toHaveBeenCalledTimes(1);
                    callback();
                  });
                });

                handler(testEvent);

                expect.hasAssertions();
              });
            });

            describe("when the restart fails, retries and fails again", () => {
              const testReason1 = mock<StateFailReason>();
              const testReason2 = mock<StateFailReason>();
              const testPreState = mock<ComponentState>();
              beforeEach(() => {
                mockHostStateManager.updateState.mockReset();
                mockHostStateManager.updateState
                  .mockResolvedValueOnce(
                    mock<StateChangeResult>({
                      success: false,
                      state: testPreState,
                      reason: testReason1,
                    }),
                  )
                  .mockResolvedValueOnce(
                    mock<StateChangeResult>({
                      success: false,
                      state: testPreState,
                      reason: testReason2,
                    }),
                  );
              });

              test("should call update state restarting two times", async () => {
                handler(testEvent);
                await jest.runAllTimersAsync();

                expect(mockHostStateManager.updateState).toHaveBeenCalledTimes(
                  2,
                );
                expect(mockHostStateManager.updateState).toHaveBeenCalledWith(
                  "restarting",
                );
              });

              test("should log warning with first result", async () => {
                handler(testEvent);
                await jest.runAllTimersAsync();

                expect(loggerMock.warn).toHaveBeenCalledWith(
                  expect.any(String),
                  {
                    reason: testReason1,
                    state: testPreState,
                  },
                );
              });

              test("should log error after delay", (callback) => {
                loggerMock.warn.mockImplementationOnce(() => {
                  expect(loggerMock.error).not.toHaveBeenCalled();
                  void jest.runAllTimersAsync().then(() => {
                    expect(loggerMock.error).toHaveBeenCalledWith(
                      expect.any(String),
                      {
                        reason: testReason2,
                        state: testPreState,
                      },
                    );
                    callback();
                  });
                });

                handler(testEvent);

                expect.assertions(2);
              });

              test("should not link connection", async () => {
                handler(testEvent);
                await jest.runAllTimersAsync();

                expect(linkConnection).not.toHaveBeenCalled();
              });
            });
          });
        });
      });
    });
  });

  test("should throw error when iframe not set", () => {
    const testEvent = mock<MessageEventWithType>();
    try {
      sut["listenForInitialMessage"](testEvent);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
    }

    expect.hasAssertions();
  });
});

describe("supportedAppSources", () => {
  let handler: (evt: MessageEventWithType) => void;
  const testIframe = {
    contentWindow: contentWindow,
  } as HTMLIFrameElement;

  beforeEach(() => {
    mockHostStateManager.updateState.mockResolvedValueOnce(
      mock<StateChangeResult>({ success: true }),
    );
    sut.setIFrame(testIframe);

    handler = mocked(window.addEventListener).mock.calls[0][1] as (
      evt: MessageEventWithType,
    ) => void;

    loggerMock.warn.mockReset();
  });

  describe("when receiving messages from supported app sources", () => {
    test("should not log warnings for supported app sources", () => {
      const testEvent = {
        data: { type: "some-type", source: "wisdom" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
      } as MessageEventWithType;

      handler(testEvent);

      expect(isSupportedAppSource(testEvent)).toBe(true);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    test("should not increment counter or log warnings for supported app sources with non-connect-app-host-init type", () => {
      const initialCount = sut["unexpectedPostMessageCount"];
      const testEvent = {
        data: { type: "some-type", source: "wisdom" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
      } as MessageEventWithType;

      handler(testEvent);

      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(sut["unexpectedPostMessageCount"]).toEqual(initialCount);
      expect(linkConnection).not.toHaveBeenCalled();
    });
  });

  describe("when receiving messages from unsupported app sources", () => {
    test("should log warnings for unsupported app sources", () => {
      const testEvent = {
        data: { type: "some-type", source: "unsupported-source" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
      } as MessageEventWithType;

      handler(testEvent);

      expect(isSupportedAppSource(testEvent)).toBe(false);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        "Unexpected PostMessage from iframe. No action",
        {
          msg: testEvent.data,
          unexpectedPostMessageCount: 1,
        },
      );
    });
    test("should log warnings for the first 5 unsupported app source messages", () => {
      const testEvent = {
        data: { type: "some-type", source: "unsupported-source" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
      } as MessageEventWithType;

      for (let i = 1; i <= 5; i++) {
        loggerMock.warn.mockClear();

        handler(testEvent);

        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
        expect(loggerMock.warn).toHaveBeenCalledWith(
          "Unexpected PostMessage from iframe. No action",
          {
            msg: testEvent.data,
            unexpectedPostMessageCount: i,
          },
        );
      }
    });

    test("should suppress warnings after 5th unsupported app source message", () => {
      const testEvent = {
        data: { type: "some-type", source: "unsupported-source" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
      } as MessageEventWithType;

      for (let i = 1; i <= 5; i++) {
        handler(testEvent);
      }

      loggerMock.warn.mockClear();

      for (let i = 5; i <= 10; i++) {
        handler(testEvent);
        expect(loggerMock.warn).not.toHaveBeenCalled();
      }
    });

    test("should continue incrementing counter even after suppression", () => {
      const testEvent = {
        data: { type: "some-type", source: "unsupported-source" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
      } as MessageEventWithType;

      for (let i = 1; i <= 10; i++) {
        handler(testEvent);
      }

      expect(sut["unexpectedPostMessageCount"]).toEqual(10);
    });
  });

  describe("when receiving messages without a source property", () => {
    test("should log warnings for the first 5 messages without source", () => {
      const testEvent = {
        data: { type: "some-type" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
      } as MessageEventWithType;

      for (let i = 1; i <= 5; i++) {
        loggerMock.warn.mockClear();
        handler(testEvent);

        expect(isSupportedAppSource(testEvent)).toBe(false);
        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
        expect(loggerMock.warn).toHaveBeenCalledWith(
          "Unexpected PostMessage from iframe. No action",
          {
            msg: testEvent.data,
            unexpectedPostMessageCount: i,
          },
        );
      }
    });
  });

  describe("when receiving connect-app-host-init messages", () => {
    test("should not log warning for unsupported source", () => {
      const testEvent = {
        data: { type: "connect-app-host-init", source: "customviews" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
        ports: [mock<MessagePort>()] as unknown,
      } as MessageEventWithType;
      mocked(linkConnection).mockImplementationOnce(() => {});
      mockHostStateManager.updateState.mockResolvedValueOnce(
        mock<StateChangeResult>({ success: true }),
      );

      handler(testEvent);

      expect(isSupportedAppSource(testEvent)).toBe(true);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });
    test("should not log warning for unsupported source", () => {
      const testEvent = {
        data: { type: "connect-app-host-init", source: "unsupported-source" },
        source: contentWindow,
        origin: new URL(accessUrl).origin,
        ports: [mock<MessagePort>()] as unknown,
      } as MessageEventWithType;
      mocked(linkConnection).mockImplementationOnce(() => {});
      mockHostStateManager.updateState.mockResolvedValueOnce(
        mock<StateChangeResult>({ success: true }),
      );

      handler(testEvent);

      expect(isSupportedAppSource(testEvent)).toBe(false);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });
  });
});

describe("Cross-region origin validation integration", () => {
  const testIframe = {
    contentWindow: contentWindow,
  } as HTMLIFrameElement;

  beforeEach(() => {
    mockHostStateManager.updateState.mockResolvedValueOnce(
      mock<StateChangeResult>({ success: true }),
    );
  });

  const createHandlerWithConfig = (accessUrl: string) => {
    const { sut } = createSut(accessUrl);
    sut.setIFrame(testIframe);
    return mocked(window.addEventListener).mock.calls[0][1] as (
      evt: MessageEventWithType,
    ) => void;
  };

  test("should accept valid cross-region origin communication", () => {
    const handler = createHandlerWithConfig("https://us-west-2.instance1.my.connect.aws");
    const testEvent = {
      data: { type: "connect-app-host-init" },
      source: contentWindow,
      origin: "https://us-east-1.instance1.my.connect.aws",
      ports: [mock<MessagePort>()] as unknown,
    } as MessageEventWithType;

    mockHostStateManager.updateState.mockResolvedValueOnce(
      mock<StateChangeResult>({ success: true }),
    );
    mocked(linkConnection).mockImplementationOnce(() => {});
    handler(testEvent);

    expect(linkConnection).toHaveBeenCalledTimes(1);
  });

  test("should reject invalid cross-region origin communication", () => {
    const handler = createHandlerWithConfig("https://us-west-2.instance1.my.connect.aws");
    const testEvent = {
      data: { type: "connect-app-host-init" },
      source: contentWindow,
      origin: "https://us-east-1.instance2.my.connect.aws",
      ports: [mock<MessagePort>()] as unknown,
    } as MessageEventWithType;

    handler(testEvent);

    expect(linkConnection).not.toHaveBeenCalled();
  });
});

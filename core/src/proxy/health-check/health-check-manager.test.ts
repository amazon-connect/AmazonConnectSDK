/* eslint-disable @typescript-eslint/unbound-method */
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ConnectLogger, LogLevel, LogProvider } from "../../logging";
import {
  HealthCheckMessage,
  HealthCheckResponseMessage,
  UpstreamMessageOrigin,
} from "../../messaging";
import { AsyncEventEmitter } from "../../utility";
import { HealthCheckManager } from "./health-check-manager";
import { HealthCheckStatusChanged } from "./health-check-status-changed";

jest.mock("../../logging/connect-logger");
jest.mock("../../utility/emitter/async-event-emitter");
jest.useFakeTimers();

const providerMock = mock<LogProvider>();
const sendHealthCheckMock = jest.fn<void, [HealthCheckMessage]>();
const messageOriginMock = mock<UpstreamMessageOrigin>();
const getUpstreamMessageOriginMock = jest.fn<UpstreamMessageOrigin, []>();
let loggerMock: MockedObject<ConnectLogger>;
let eventEmitterMock: MockedObject<AsyncEventEmitter<HealthCheckStatusChanged>>;

const testConnectionId = "test-connection-id";
const getMixin = () => {
  const loggerConfig = mocked(ConnectLogger).mock.calls[0][0];
  if (typeof loggerConfig === "string") throw Error("ts needs this");
  return loggerConfig.mixin!({}, LogLevel.info);
};

let sut: HealthCheckManager;

beforeEach(jest.resetAllMocks);
beforeEach(jest.clearAllTimers);

beforeEach(() => {
  getUpstreamMessageOriginMock.mockReturnValue(messageOriginMock);

  sut = new HealthCheckManager({
    provider: providerMock,
    sendHealthCheck: sendHealthCheckMock,
    getUpstreamMessageOrigin: getUpstreamMessageOriginMock,
  });

  loggerMock = mocked(ConnectLogger).mock.instances[0];
  eventEmitterMock = mocked(AsyncEventEmitter<HealthCheckStatusChanged>).mock
    .instances[0];
});

describe("constructor", () => {
  test("should create logger with null connectionId in mixin", () => {
    const mixinResult = getMixin();

    expect(ConnectLogger).toHaveBeenCalledWith({
      provider: providerMock,
      source: expect.any(String) as string,
      mixin: expect.any(Function) as () => void,
    });
    expect(mixinResult.connectionId).toBeNull();
  });

  test("should create event emitter", () => {
    expect(AsyncEventEmitter).toHaveBeenCalledWith({
      provider: providerMock,
      loggerKey: expect.any(String) as string,
    });
  });

  test("should set status to unknown", () => {
    expect(sut.status).toBe("unknown");
  });

  test("should start as not running", () => {
    expect(sut.isRunning).toBeFalsy();
  });

  test("should start with last check counter as null", () => {
    expect(sut.lastCheckCounter).toBeNull();
  });

  test("should start with last check time as null", () => {
    expect(sut.lastCheckTime).toBeNull();
  });
});

describe("start", () => {
  describe("when the interval is -1", () => {
    test("should not start", () => {
      sut.start({ healthCheckInterval: -1, connectionId: testConnectionId });

      expect(loggerMock.debug).toHaveBeenCalledTimes(1);
      expect(sut.isRunning).toBeFalsy();
    });

    test("should set the connection", () => {
      sut.start({ healthCheckInterval: -1, connectionId: testConnectionId });

      const result = getMixin().connectionId;

      expect(result).toBe(testConnectionId);
    });
  });

  describe("when the interval is between 1 and 999", () => {
    test("should not start and log error", () => {
      sut.start({ healthCheckInterval: 500, connectionId: testConnectionId });

      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        interval: 500,
      });
      expect(sut.isRunning).toBeFalsy();
    });

    test("should set the connection", () => {
      sut.start({ healthCheckInterval: 500, connectionId: testConnectionId });

      const result = getMixin().connectionId;

      expect(result).toBe(testConnectionId);
    });
  });

  describe("when the interval is >= 1000", () => {
    test("should send the initial health check message", () => {
      sut.start({ healthCheckInterval: 4000, connectionId: testConnectionId });

      expect(sendHealthCheckMock).toHaveBeenCalledTimes(1);
      expect(sendHealthCheckMock).toHaveBeenCalledWith({
        type: "healthCheck",
        messageOrigin: messageOriginMock,
      });
    });

    test("should make multiple requests based upon the interval", () => {
      sut.start({
        healthCheckInterval: 4000,
        connectionId: testConnectionId,
      });

      jest.advanceTimersByTime(4000 * 2 + 10);
      expect(sendHealthCheckMock).toHaveBeenCalledTimes(3);
      expect(sendHealthCheckMock).toHaveBeenCalledWith({
        type: "healthCheck",
        messageOrigin: messageOriginMock,
      });
    });

    describe("when the interval advances 3x without getting an initial response", () => {
      beforeEach(() => {
        sut.start({
          healthCheckInterval: 4000,
          connectionId: testConnectionId,
        });
        loggerMock.info.mockReset();
        eventEmitterMock.emit.mockReset();

        jest.advanceTimersByTime(4000 * 3 + 10);
      });

      test("should be unhealthy", () => {
        expect(sut.status).toBe("unhealthy");
      });

      test("should log connection is unhealthy", () => {
        expect(loggerMock.info).toHaveBeenCalledWith("Connection unhealthy", {
          previousStatus: "unknown",
        });
      });

      test("should emit unhealthy", () => {
        expect(eventEmitterMock.emit).toHaveBeenCalledWith(
          HealthCheckManager["statusChangedKey"],
          {
            status: "unhealthy",
            previousStatus: "unknown",
            lastCheckTime: null,
            lastCheckCounter: null,
          },
        );
      });
    });

    describe("when the interval advances 3x after getting initial response", () => {
      const lastCheckCounter = 1;
      const lastCheckTime = 1000;

      beforeEach(() => {
        sut.start({
          healthCheckInterval: 4000,
          connectionId: testConnectionId,
        });
        sut.handleResponse(
          mock<HealthCheckResponseMessage>({
            time: lastCheckTime,
            counter: lastCheckCounter,
          }),
        );

        loggerMock.info.mockReset();
        eventEmitterMock.emit.mockReset();

        jest.advanceTimersByTime(4000 * 3 + 10);
      });

      test("should be unhealthy", () => {
        expect(sut.status).toBe("unhealthy");
      });

      test("should log connection is unhealthy", () => {
        expect(loggerMock.info).toHaveBeenCalledWith("Connection unhealthy", {
          previousStatus: "healthy",
        });
      });

      test("should emit unhealthy", () => {
        expect(eventEmitterMock.emit).toHaveBeenCalledWith(
          HealthCheckManager["statusChangedKey"],
          {
            status: "unhealthy",
            previousStatus: "healthy",
            lastCheckTime: lastCheckTime,
            lastCheckCounter: lastCheckCounter,
          },
        );
      });

      describe("when called unhealthy a second time", () => {
        beforeEach(() => {
          eventEmitterMock.emit.mockReset();
          loggerMock.info.mockReset();
          sut["setUnhealthy"]();
        });

        test("should be unhealthy", () => {
          expect(sut.status).toBe("unhealthy");
        });

        test("should not log info again", () => {
          expect(loggerMock.info).not.toHaveBeenCalled();
        });

        test("should not emit unhealthy", () => {
          expect(eventEmitterMock.emit).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("when starting timeout without calling start", () => {
    test("should log error with no action", () => {
      sut["startTimeout"]();

      expect(loggerMock.error).toHaveBeenCalledTimes(1);
      expect(sut["healthCheckInterval"]).toBeNull();
    });
  });
});

describe("stop", () => {
  describe("when not started", () => {
    test("should take no action", () => {
      sut.stop();

      expect(sut.isRunning).toBeFalsy();
    });
  });

  describe("when started", () => {
    test("should stop interval and timeout", () => {
      sut.start({ healthCheckInterval: 2000, connectionId: testConnectionId });
      eventEmitterMock.emit.mockReset();

      sut.stop();

      // Check interval
      expect(sut.isRunning).toBeFalsy();
      jest.runAllTimers();
      // Timeout would eventually cause event emitted if not stopped
      expect(eventEmitterMock.emit).not.toHaveBeenCalled();
    });
  });
});

describe("handleResponse", () => {
  const messageTime = 8000;

  describe("For the first message", () => {
    beforeEach(() => {
      sut.start({ healthCheckInterval: 1000, connectionId: testConnectionId });
      eventEmitterMock.emit.mockReset();
      sut.handleResponse(
        mock<HealthCheckResponseMessage>({ time: messageTime, counter: 1 }),
      );
    });

    test("should set status as healthy with last check time and counter", () => {
      expect(sut.status).toBe("healthy");
      expect(sut.lastCheckTime).toBe(messageTime);
      expect(sut.lastCheckCounter).toBe(1);
    });

    test("should log healthy", () => {
      expect(loggerMock.debug).toHaveBeenCalledWith("Connection healthy", {
        previousStatus: "unknown",
      });
    });

    test("should emit status changed to healthy", () => {
      expect(eventEmitterMock.emit).toHaveBeenCalledWith(
        HealthCheckManager["statusChangedKey"],
        {
          status: "healthy",
          previousStatus: "unknown",
          lastCheckTime: messageTime,
          lastCheckCounter: 1,
        },
      );
    });
  });

  describe("When currently healthy", () => {
    const messageCounter = 100;

    beforeEach(() => {
      sut.start({ healthCheckInterval: 1000, connectionId: testConnectionId });
      sut.handleResponse(
        mock<HealthCheckResponseMessage>({ time: 1, counter: 1 }),
      );
      eventEmitterMock.emit.mockReset();
      loggerMock.debug.mockReset();

      sut.handleResponse(
        mock<HealthCheckResponseMessage>({
          time: messageTime,
          counter: messageCounter,
        }),
      );
    });

    test("should retrain status as healthy with updated last check time and counter", () => {
      expect(sut.status).toBe("healthy");
      expect(sut.lastCheckTime).toBe(messageTime);
      expect(sut.lastCheckCounter).toBe(messageCounter);
    });

    test("should not log healthy again", () => {
      expect(loggerMock.debug).not.toHaveBeenCalledWith();
    });

    test("should not emit status change", () => {
      expect(eventEmitterMock.emit).not.toHaveBeenCalled();
    });
  });

  describe("When currently unhealthy", () => {
    const messageCounter = 100;

    beforeEach(() => {
      sut.start({ healthCheckInterval: 1000, connectionId: testConnectionId });
      sut.handleResponse(
        mock<HealthCheckResponseMessage>({ time: 1, counter: 1 }),
      );
      sut["setUnhealthy"]();
      eventEmitterMock.emit.mockReset();
      loggerMock.debug.mockReset();

      sut.handleResponse(
        mock<HealthCheckResponseMessage>({
          time: messageTime,
          counter: messageCounter,
        }),
      );
    });

    test("should set status as healthy with last check time and counter", () => {
      expect(sut.status).toBe("healthy");
      expect(sut.lastCheckTime).toBe(messageTime);
      expect(sut.lastCheckCounter).toBe(messageCounter);
    });

    test("should log healthy", () => {
      expect(loggerMock.debug).toHaveBeenCalledWith("Connection healthy", {
        previousStatus: "unhealthy",
      });
    });

    test("should emit status changed to healthy", () => {
      expect(eventEmitterMock.emit).toHaveBeenCalledWith(
        HealthCheckManager["statusChangedKey"],
        {
          status: "healthy",
          previousStatus: "unhealthy",
          lastCheckTime: messageTime,
          lastCheckCounter: messageCounter,
        },
      );
    });
  });
});

describe("onStatusChanged", () => {
  test("should add handler to predefined key", () => {
    const handler = jest.fn();

    sut.onStatusChanged(handler);

    expect(eventEmitterMock.on).toHaveBeenCalledWith(
      HealthCheckManager["statusChangedKey"],
      handler,
    );
  });
});

describe("offStatusChanged", () => {
  test("should add handler to predefined key", () => {
    const handler = jest.fn();

    sut.offStatusChanged(handler);

    expect(eventEmitterMock.off).toHaveBeenCalledWith(
      HealthCheckManager["statusChangedKey"],
      handler,
    );
  });
});

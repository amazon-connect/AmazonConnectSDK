import { AmazonConnectProvider } from "@amazon-connect/core/lib/provider";
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { StateChangeRelay } from "../../host/state-change-relay";
import { AppStateTopicKey } from "../../topic-keys";
import {
  AppDestroyedHandler,
  AppDestroyingHandler,
  AppErrorHandler,
  AppProvisionedHandler,
  AppRestartingHandler,
  AppRunningHandler,
  AppStateChangedHandler,
  AppStoppedHandler,
} from "../app-event-types";
import { AppInstanceData } from "../app-instance-data";
import { AppFocusRelay } from "./app-focus-relay";
import { AppHost } from "./app-host";
import { AppHostEventRelay, AppStateChangeRelay } from "./app-host-event-relay";

jest.mock("../../host/state-change-relay");
jest.mock("./app-focus-relay");
jest.useFakeTimers();

const StateChangeRelayMock = StateChangeRelay as MockedClass<
  typeof StateChangeRelay<AppStateChangedHandler, AppHost, AppInstanceData>
>;
const AppFocusedRelayMock = AppFocusRelay as MockedClass<typeof AppFocusRelay>;

const provider = mock<AmazonConnectProvider>();
const appHost = mock<AppHost>();

let sut: AppHostEventRelay;

let stateChangedMock: MockedObject<AppStateChangeRelay<AppStateChangedHandler>>;
let provisionedMock: MockedObject<AppStateChangeRelay<AppProvisionedHandler>>;
let runningMock: MockedObject<AppStateChangeRelay<AppRunningHandler>>;
let stoppedMock: MockedObject<AppStateChangeRelay<AppStoppedHandler>>;
let restartingMock: MockedObject<AppStateChangeRelay<AppRestartingHandler>>;
let destroyingMock: MockedObject<AppStateChangeRelay<AppDestroyingHandler>>;
let destroyedMock: MockedObject<AppStateChangeRelay<AppDestroyedHandler>>;
let errorMock: MockedObject<AppStateChangeRelay<AppErrorHandler>>;
let focusedMock: MockedObject<AppFocusRelay>;

beforeEach(jest.resetAllMocks);
beforeEach(jest.clearAllTimers);

beforeEach(() => {
  sut = new AppHostEventRelay(provider, appHost);

  stateChangedMock = StateChangeRelayMock.mock.instances[0];
  provisionedMock = StateChangeRelayMock.mock.instances[1];
  runningMock = StateChangeRelayMock.mock.instances[2];
  stoppedMock = StateChangeRelayMock.mock.instances[3];
  restartingMock = StateChangeRelayMock.mock.instances[4];
  destroyingMock = StateChangeRelayMock.mock.instances[5];
  destroyedMock = StateChangeRelayMock.mock.instances[6];
  errorMock = StateChangeRelayMock.mock.instances[7] as MockedObject<
    AppStateChangeRelay<AppErrorHandler>
  >;
  focusedMock = AppFocusedRelayMock.mock.instances[0];
});

describe("constructor", () => {
  test("should setup state changed relay", () => {
    expect(StateChangeRelayMock.mock.calls[0][0]).toEqual({
      provider,
      host: appHost,
      appHost,
      topicKey: AppStateTopicKey.StateChanged,
    });
    expect(sut.stateChanged).toEqual(stateChangedMock);
  });

  test("should setup provisioned relay", () => {
    expect(StateChangeRelayMock.mock.calls[1][0]).toEqual({
      provider,
      host: appHost,
      appHost,
      topicKey: AppStateTopicKey.Provisioned,
    });
    expect(sut.provisioned).toEqual(provisionedMock);
  });

  test("should setup running relay", () => {
    expect(StateChangeRelayMock.mock.calls[2][0]).toEqual({
      provider,
      host: appHost,
      appHost,
      topicKey: AppStateTopicKey.Running,
    });
    expect(sut.running).toEqual(runningMock);
  });

  test("should setup stopped relay", () => {
    expect(StateChangeRelayMock.mock.calls[3][0]).toEqual({
      provider,
      host: appHost,
      appHost,
      topicKey: AppStateTopicKey.Stopped,
    });
    expect(sut.stopped).toEqual(stoppedMock);
  });

  test("should setup restarting relay", () => {
    expect(StateChangeRelayMock.mock.calls[4][0]).toEqual({
      provider,
      host: appHost,
      appHost,
      topicKey: AppStateTopicKey.Restarting,
    });
    expect(sut.restarting).toEqual(restartingMock);
  });

  test("should setup destroying relay", () => {
    expect(StateChangeRelayMock.mock.calls[5][0]).toEqual({
      provider,
      host: appHost,
      appHost,
      topicKey: AppStateTopicKey.Destroying,
    });
    expect(sut.destroying).toEqual(destroyingMock);
  });

  test("should setup destroyed relay", () => {
    expect(StateChangeRelayMock.mock.calls[6][0]).toEqual({
      provider,
      host: appHost,
      appHost,
      topicKey: AppStateTopicKey.Destroyed,
    });
    expect(sut.destroyed).toEqual(destroyedMock);
  });

  test("should setup error relay", () => {
    expect(StateChangeRelayMock.mock.calls[7][0]).toEqual({
      provider,
      host: appHost,
      appHost,
      topicKey: AppStateTopicKey.Error,
    });
    expect(sut.error).toEqual(errorMock);
  });

  test("should setup app focused relay", () => {
    expect(AppFocusedRelayMock.mock.calls[0][0]).toEqual({
      provider,
      host: appHost,
    });
    expect(sut.focused).toEqual(focusedMock);
  });
});

describe("delayedDestroy", () => {
  test("should destroy all relays after delay", () => {
    sut.delayedDestroy();

    expect(stateChangedMock.destroy).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();

    expect(stateChangedMock.destroy).toHaveBeenCalled();
    expect(provisionedMock.destroy).toHaveBeenCalled();
    expect(runningMock.destroy).toHaveBeenCalled();
    expect(stoppedMock.destroy).toHaveBeenCalled();
    expect(restartingMock.destroy).toHaveBeenCalled();
    expect(destroyingMock.destroy).toHaveBeenCalled();
    expect(destroyedMock.destroy).toHaveBeenCalled();
    expect(errorMock.destroy).toHaveBeenCalled();
    expect(focusedMock.destroy).toHaveBeenCalled();
  });

  describe("when calling immediate during delay", () => {
    test("should destroy all relays immediately", () => {
      sut.delayedDestroy();

      expect(stateChangedMock.destroy).not.toHaveBeenCalled();

      sut.immediateDestroy();

      expect(stateChangedMock.destroy).toHaveBeenCalled();
      expect(provisionedMock.destroy).toHaveBeenCalled();
      expect(runningMock.destroy).toHaveBeenCalled();
      expect(stoppedMock.destroy).toHaveBeenCalled();
      expect(restartingMock.destroy).toHaveBeenCalled();
      expect(destroyingMock.destroy).toHaveBeenCalled();
      expect(destroyedMock.destroy).toHaveBeenCalled();
      expect(errorMock.destroy).toHaveBeenCalled();
      expect(focusedMock.destroy).toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});

describe("immediateDestroy", () => {
  test("should destroy all relays", () => {
    sut.immediateDestroy();

    expect(stateChangedMock.destroy).toHaveBeenCalled();
    expect(provisionedMock.destroy).toHaveBeenCalled();
    expect(runningMock.destroy).toHaveBeenCalled();
    expect(stoppedMock.destroy).toHaveBeenCalled();
    expect(restartingMock.destroy).toHaveBeenCalled();
    expect(destroyingMock.destroy).toHaveBeenCalled();
    expect(destroyedMock.destroy).toHaveBeenCalled();
    expect(errorMock.destroy).toHaveBeenCalled();
    expect(focusedMock.destroy).toHaveBeenCalled();
  });
});

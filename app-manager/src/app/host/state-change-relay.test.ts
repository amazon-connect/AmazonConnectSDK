import { AmazonConnectProvider, Proxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { AppStateTopicKey } from "../../topic-keys";
import {
  AppInstanceStateChanged,
  AppStateChanged,
  AppStateChangedHandler,
} from "../app-event-types";
import { AppInstanceData } from "../app-instance-data";
import { AppHost } from "./app-host";
import { StateChangeRelay } from "./state-change-relay";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const proxyMock = mock<Proxy>();
const providerMock = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});
const appHost = mock<AppHost>();

let sut: StateChangeRelay<AppStateChangedHandler>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new StateChangeRelay({
    provider: providerMock,
    topicKey: AppStateTopicKey.StateChanged,
    appHost,
  });
});

test("should emit translated event with appHost", async () => {
  const handler = jest.fn();
  sut.on(handler);

  const internalHandler = proxyMock.subscribe.mock.calls[0][1];

  const innerEvent: AppInstanceStateChanged = {
    ...mock<AppInstanceData>(),
    stateVersion: 4,
    state: "running",
    previous: {
      state: "stopped",
    },
  };
  const expected: AppStateChanged = {
    appHost,
    host: appHost,
    state: "running",
    previous: { state: "stopped" },
  };

  await internalHandler(innerEvent);

  expect(handler).toHaveBeenCalledWith(expected);
});

import {
  AmazonConnectProvider,
  Proxy,
  SubscriptionHandler,
} from "@amazon-connect/core";
import { ConfigBase } from "@amazon-connect/workspace-types";
import { mock } from "jest-mock-extended";

import { ComponentState } from "../component-state";
import { AppStateTopicKey } from "../topic-keys";
import { Host } from "./host";
import { InstanceData } from "./instance-data";
import { StateChangeRelay } from "./state-change-relay";
import { InstanceStateChanged } from "./state-changed-types";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestHost = Host<any, ConfigBase>;
type TestStateChanged = {
  appHost: TestHost;
  host: TestHost;
  state: ComponentState;
  previous: { state: ComponentState };
};
type TestStateChangedHandler = SubscriptionHandler<TestStateChanged>;

const proxyMock = mock<Proxy>();
const providerMock = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});
const testHost = mock<TestHost>();

let sut: StateChangeRelay<TestStateChangedHandler, TestHost, InstanceData>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new StateChangeRelay({
    provider: providerMock,
    topicKey: AppStateTopicKey.StateChanged,
    host: testHost as TestHost,
  });
});

test("should emit translated event with appHost", async () => {
  const handler = jest.fn();
  sut.on(handler);

  const internalHandler = proxyMock.subscribe.mock.calls[0][1];

  const innerEvent: InstanceStateChanged<InstanceData> = {
    ...mock<InstanceData>(),
    stateVersion: 4,
    state: "running",
    previous: {
      state: "stopped",
    },
  };
  const expected: TestStateChanged = {
    appHost: testHost,
    host: testHost,
    state: "running",
    previous: { state: "stopped" },
  };

  await internalHandler(innerEvent);

  expect(handler).toHaveBeenCalledWith(expected);
});

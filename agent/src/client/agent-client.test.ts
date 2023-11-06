import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { AgentStateChangeEventData, AgentTopic } from "../event/agent-events";
import { AgentClient } from "./agent-client";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>();

Object.defineProperty(moduleContextMock, "proxy", {
  get() {
    return moduleProxyMock;
  },
});

beforeEach(jest.resetAllMocks);

describe("AgentClient", () => {
  const agentClient = new AgentClient({
    context: moduleContextMock,
  });

  describe("Events", () => {
    const handler = (data: AgentStateChangeEventData) => {
      console.log(data);
      return Promise.resolve();
    };

    test("onStateChange adds subscription", () => {
      const spy = jest.spyOn(moduleProxyMock, "subscribe");
      agentClient.onStateChange(handler);
      expect(spy).toBeCalledWith({ key: AgentTopic.STATE_CHANGE }, handler);
    });

    test("offStateChange removes subscription", () => {
      const spy = jest.spyOn(moduleProxyMock, "unsubscribe");
      agentClient.offStateChange(handler);
      expect(spy).toBeCalledWith({ key: AgentTopic.STATE_CHANGE }, handler);
    });
  });
});

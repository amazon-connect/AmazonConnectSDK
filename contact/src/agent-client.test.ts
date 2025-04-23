/* eslint-disable @typescript-eslint/unbound-method */
import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { AgentClient } from "./agent-client";
import { AgentRoutes } from "./routes";
import { AgentTopicKey } from "./topic-keys";
import {
  AgentChannelConcurrency,
  AgentRoutingProfile,
  AgentState,
  Queue,
  QuickConnect,
  SetAvailabilityStateResult,
} from "./types";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: AgentClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new AgentClient({ context: moduleContextMock });
});

describe("AgentClient", () => {
  describe("Events", () => {
    test("onStateChange adds subscription", () => {
      const handler = jest.fn();

      sut.onStateChanged(handler);

      expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
        { key: AgentTopicKey.StateChanged },
        handler,
      );
    });

    test("offStateChange removes subscription", () => {
      const handler = jest.fn();

      sut.offStateChanged(handler);

      expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
        { key: AgentTopicKey.StateChanged },
        handler,
      );
    });
  });

  describe("Requests", () => {
    test("getARN returns result", async () => {
      const arn = "ARN";
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ ARN: arn })),
      );

      const actualResult = await sut.getARN();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(AgentRoutes.getARN);
      expect(actualResult).toEqual(arn);
    });

    test("getName returns result", async () => {
      const name = "name";
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ name })),
      );

      const actualResult = await sut.getName();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(AgentRoutes.getName);
      expect(actualResult).toEqual(name);
    });

    test("getState returns result", async () => {
      const state: AgentState = {
        agentStateARN: "ARN",
        name: "name",
        startTimestamp: new Date(),
        type: "init",
      };
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(state)),
      );

      const actualResult = await sut.getState();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        AgentRoutes.getState,
      );
      expect(actualResult).toEqual(state);
    });

    test("getRoutingProfile returns result", async () => {
      const queue: Queue = { name: "name", queueARN: "arn", queueId: "id" };
      const profile: AgentRoutingProfile = {
        channelConcurrencyMap: { ["voice"]: 1 },
        defaultOutboundQueue: queue,
        name: "routing profile",
        queues: [queue],
        routingProfileARN: "ARN",
        routingProfileId: "id",
      };
      moduleProxyMock.request.mockResolvedValueOnce(profile);

      const actualResult = await sut.getRoutingProfile();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        AgentRoutes.getRoutingProfile,
      );
      expect(actualResult).toEqual(profile);
    });

    test("getChannelConcurrency returns result", async () => {
      const concurrency: AgentChannelConcurrency = {
        ["voice"]: 1,
      };
      moduleProxyMock.request.mockResolvedValueOnce(concurrency);

      const actualResult = await sut.getChannelConcurrency();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        AgentRoutes.getChannelConcurrency,
      );
      expect(actualResult).toEqual(concurrency);
    });

    test("getExtension returns result when available", async () => {
      const extension = "123";
      moduleProxyMock.request.mockResolvedValueOnce({ extension });

      const actualResult = await sut.getExtension();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        AgentRoutes.getExtension,
      );
      expect(actualResult).toEqual(extension);
    });

    test("getExtension returns undefined when result is not available", async () => {
      moduleProxyMock.request.mockResolvedValueOnce({ extension: undefined });

      const actualResult = await sut.getExtension();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        AgentRoutes.getExtension,
      );
      expect(actualResult).toBeUndefined();
    });

    test("getDialableCountries returns result", async () => {
      const dialableCountries = ["us"];
      moduleProxyMock.request.mockResolvedValueOnce({ dialableCountries });

      const actualResult = await sut.getDialableCountries();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        AgentRoutes.getDialableCountries,
      );
      expect(actualResult).toEqual(dialableCountries);
    });
  });

  test("setAvailabilityState sends request to AgentRoutes.setAvailabilityState", async () => {
    const expectedResult: SetAvailabilityStateResult = {
      status: "in_progress",
    };
    moduleProxyMock.request.mockResolvedValueOnce(expectedResult);
    const agentStateARN = "dummyAgentStateARN";

    const actualResult = await sut.setAvailabilityState(agentStateARN);

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AgentRoutes.setAvailabilityState,
      { agentStateARN },
    );
    expect(actualResult).toEqual(expectedResult);
  });

  test("setStateByName sends request to AgentRoutes.setStateByName", async () => {
    const expectedResult: SetAvailabilityStateResult = {
      status: "in_progress",
    };
    moduleProxyMock.request.mockResolvedValueOnce(expectedResult);
    const agentStateName = "agent-state-name";

    const actualResult = await sut.setAvailabilityStateByName(agentStateName);

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AgentRoutes.setAvailabilityStateByName,
      { agentStateName },
    );
    expect(actualResult).toEqual(expectedResult);
  });

  test("setOffline sends request to AgentRoutes.setOffline", async () => {
    const expectedResult: SetAvailabilityStateResult = {
      status: "in_progress",
    };
    moduleProxyMock.request.mockResolvedValueOnce(expectedResult);

    const actualResult = await sut.setOffline();

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AgentRoutes.setOffline,
    );
    expect(actualResult).toEqual(expectedResult);
  });

  test("listAvailabilityStates returns result", async () => {
    const agentState: AgentState = {
      name: "myStateName",
      agentStateARN: "myStateARN",
      type: "not_routable",
    };
    moduleProxyMock.request.mockResolvedValueOnce([agentState]);

    const actualResult = await sut.listAvailabilityStates();

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AgentRoutes.listAvailabilityStates,
    );
    expect(actualResult).toEqual([agentState]);
  });

  test("listQuickConnects returns result", async () => {
    const quickConnects: QuickConnect[] = [
      {
        type: "agent",
        endpointARN: "test-agent-arn",
        name: "Test Agent",
      },
    ];
    moduleProxyMock.request.mockResolvedValueOnce([quickConnects]);

    const queueARNs = ["my-queue-arn"];
    const options = {
      maxResults: 1000,
    };

    const actualResult = await sut.listQuickConnects(queueARNs, {
      maxResults: 1000,
    });

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      AgentRoutes.listQuickConnects,
      { queueARNs, options },
    );
    expect(actualResult).toEqual([quickConnects]);
  });
});

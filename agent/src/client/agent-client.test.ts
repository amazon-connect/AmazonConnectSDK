import { ConnectRequestData, ConnectResponseData, ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { AgentStateChangeEventData, AgentTopic } from "../event/agent-events";
import { AgentClient } from "./agent-client";
import { Endpoint, EndpointType, AgentRequests, AgentState, AgentStateType, Queue, AgentRoutingProfile, ChannelType, AgentChannelConcurrencyMap } from "../request";

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

  describe("Requests", () => {
    let requestSpy: jest.SpyInstance<
      Promise<ConnectResponseData>,
      [command: string, data?: ConnectRequestData | undefined],
      unknown
    >;

    beforeEach(() => {
      requestSpy = jest.spyOn(moduleProxyMock, "request");
    });

    test("getEndpoints returns result", async () => {
      const queueARNs = "ARN";
      const endpoints: Endpoint[] = [
        {
          endpointARN: "ARN",
          endpointId: "id",
          type: EndpointType.AGENT,
          name: "name",
          phoneNumber: "number",
          agentLogin: "login",
          queue: "queue",
        },
      ];
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ endpoints })),
      );
      const actualResult = await agentClient.getEndpoints(queueARNs);
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getEndpoints, {
        queueARNs,
      });
      expect(actualResult).toEqual(endpoints);
    });

    test("getARN returns result", async () => {
      const arn = "ARN";
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ ARN: arn })),
      );
      const actualResult = await agentClient.getARN();
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getARN);
      expect(actualResult).toEqual(arn);
    });

    test("getName returns result", async () => {
      const name = "name";
      requestSpy.mockReturnValue(new Promise((resolve) => resolve({ name })));
      const actualResult = await agentClient.getName();
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getName);
      expect(actualResult).toEqual(name);
    });

    test("getState returns result", async () => {
      const state: AgentState = {
        agentStateARN: "ARN",
        name: "name",
        startTimestamp: new Date(),
        type: AgentStateType.INIT,
      };
      requestSpy.mockReturnValue(new Promise((resolve) => resolve(state)));
      const actualResult = await agentClient.getState();
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getState);
      expect(actualResult).toEqual(state);
    });

    test("getRoutingProfile returns result", async () => {
      const queue: Queue = { name: "name", queueARN: "arn", queueId: "id" };
      const profile: AgentRoutingProfile = {
        channelConcurrencyMap: { [ChannelType.VOICE]: 1 },
        defaultOutboundQueue: { name: "name", queueARN: "arn", queueId: "id" },
        name: "routing profile",
        queues: [queue],
        routingProfileARN: "ARN",
        routingProfileId: "id",
      };
      requestSpy.mockReturnValue(new Promise((resolve) => resolve(profile)));
      const actualResult = await agentClient.getRoutingProfile();
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getRoutingProfile);
      expect(actualResult).toEqual(profile);
    });

    test("getChannelConcurrency returns result", async () => {
      const concurrency: AgentChannelConcurrencyMap = {
        [ChannelType.VOICE]: 1,
      };
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve(concurrency)),
      );
      const actualResult = await agentClient.getChannelConcurrency();
      expect(requestSpy).toHaveBeenCalledWith(
        AgentRequests.getChannelConcurrency,
      );
      expect(actualResult).toEqual(concurrency);
    });

    test("getExtension returns result when available", async () => {
      const extension = "123";
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ extension })),
      );
      const actualResult = await agentClient.getExtension();
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getExtension);
      expect(actualResult).toEqual(extension);
    });

    test("getExtension returns null when result is not available", async () => {
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ extension: undefined })),
      );
      const actualResult = await agentClient.getExtension();
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getExtension);
      expect(actualResult).toBeNull();
    });

    test("getDialableCountries returns result", async () => {
      const dialableCountries = ["us"];
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ dialableCountries })),
      );
      const actualResult = await agentClient.getDialableCountries();
      expect(requestSpy).toHaveBeenCalledWith(
        AgentRequests.getDialableCountries,
      );
      expect(actualResult).toEqual(dialableCountries);
    });

    test("getAllQueueARNs returns result", async () => {
      const allQueueARNs = ["arn1", "arn2"];
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ allQueueARNs })),
      );
      const actualResult = await agentClient.getAllQueueARNs();
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getAllQueueARNs);
      expect(actualResult).toEqual(allQueueARNs);
    });

    test("getPermissions returns result", async () => {
      const permissions = ["permission1", "permission2"];
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ permissions })),
      );
      const actualResult = await agentClient.getPermissions();
      expect(requestSpy).toHaveBeenCalledWith(AgentRequests.getPermissions);
      expect(actualResult).toEqual(permissions);
    });
  });
});

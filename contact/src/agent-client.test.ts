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

      expect(moduleProxyMock.subscribe).toBeCalledWith(
        { key: AgentTopicKey.StateChanged },
        handler,
      );
    });

    test("offStateChange removes subscription", () => {
      const handler = jest.fn();

      sut.offStateChanged(handler);

      expect(moduleProxyMock.unsubscribe).toBeCalledWith(
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
});

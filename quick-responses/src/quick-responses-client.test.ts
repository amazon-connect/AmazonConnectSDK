/* eslint-disable @typescript-eslint/unbound-method */
import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { QuickResponsesClient } from "./quick-responses-client";
import { QuickResponsesRoute } from "./routes";
import {
  QuickResponsesEnabledState,
  SearchQuickResponsesRequest,
  SearchQuickResponsesResult,
} from "./types";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: QuickResponsesClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new QuickResponsesClient({
    context: moduleContextMock,
  });
});

describe("QuickResponsesClient", () => {
  describe("isEnabled", () => {
    test("isEnabled returns enabled response", async () => {
      const expectedState: QuickResponsesEnabledState = {
        isEnabled: true,
        knowledgeBaseId: "someKnowledgeBaseId",
      };

      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(expectedState)),
      );
      const actualResult = await sut.isEnabled();
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        QuickResponsesRoute.isEnabled,
      );
      expect(actualResult).toStrictEqual(expectedState);
    });

    test("isEnabled returns enabled response without knowledgeBaseId", async () => {
      const expectedState: QuickResponsesEnabledState = {
        isEnabled: false,
      };

      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(expectedState)),
      );
      const actualResult = await sut.isEnabled();
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        QuickResponsesRoute.isEnabled,
      );
      expect(actualResult).toStrictEqual(expectedState);
    });

    test("isEnabled throws exception when success is false", async () => {
      const expectedError = new Error("something went wrong");
      moduleProxyMock.request.mockRejectedValueOnce(expectedError);

      try {
        await sut.isEnabled();
      } catch (e) {
        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          QuickResponsesRoute.isEnabled,
        );
        expect(e).toBe(expectedError);
      }
      expect.hasAssertions();
    });
  });

  describe("searchQuickResponses", () => {
    const mockRequest = mock<SearchQuickResponsesRequest>();

    test("searchQuickResponses returns search result", async () => {
      const mockProxyResponse: SearchQuickResponsesResult = {
        results: [],
        nextToken: "someToken",
      };

      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(mockProxyResponse)),
      );
      const actualResult = await sut.searchQuickResponses(mockRequest);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        QuickResponsesRoute.searchQuickResponses,
        mockRequest,
      );
      expect(actualResult).toStrictEqual(mockProxyResponse);
    });

    test("searchQuickResponses throws with correct exception when not successful", async () => {
      const expectedError = new Error("something went wrong");
      moduleProxyMock.request.mockRejectedValueOnce(expectedError);

      try {
        await sut.searchQuickResponses(mockRequest);
      } catch (e) {
        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          QuickResponsesRoute.searchQuickResponses,
          mockRequest,
        );
        expect(e).toBe(expectedError);
      }
      expect.hasAssertions();
    });
  });
});

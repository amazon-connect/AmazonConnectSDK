import { mock } from "jest-mock-extended";

import { InterceptorStore, InterceptorStoreEntry } from "./interceptor-store";
import { Interceptor, InterceptorInvokedHandler } from "./interceptor-types";

describe("InterceptorStore", () => {
  let interceptorStore: InterceptorStore;
  const mockInterceptor = mock<Interceptor>();
  let mockHandler: InterceptorInvokedHandler;
  let testEntry: InterceptorStoreEntry;

  beforeEach(() => {
    interceptorStore = new InterceptorStore();
    mockHandler = jest.fn();
    testEntry = {
      interceptor: mockInterceptor,
      interceptorKey: "testKey",
      parameter: "testParam",
    };
  });

  describe("interceptorExists", () => {
    test("should return false when interceptor does not exist", () => {
      expect(interceptorStore.interceptorExists(testEntry)).toBeFalsy();
    });

    test("should return true when interceptor exists", () => {
      interceptorStore.startAdd(testEntry);
      expect(interceptorStore.interceptorExists(testEntry)).toBeTruthy();
    });
  });

  describe("startAdd", () => {
    test("should successfully start adding an interceptor", () => {
      interceptorStore.startAdd(testEntry);
      expect(interceptorStore.interceptorExists(testEntry)).toBeTruthy();
    });

    test("should throw error when adding duplicate interceptor", () => {
      interceptorStore.startAdd(testEntry);
      expect(() => interceptorStore.startAdd(testEntry)).toThrow(
        "Interceptor already exists",
      );
    });

    test("should handle interceptors without parameters", () => {
      const entryWithoutParam: InterceptorStoreEntry = {
        interceptor: mockInterceptor,
        interceptorKey: "testKey",
      };

      interceptorStore.startAdd(entryWithoutParam);
      expect(
        interceptorStore.interceptorExists(entryWithoutParam),
      ).toBeTruthy();
    });

    test("should handle multiple interceptors with same key but different parameters", () => {
      const entry1 = { ...testEntry, parameter: "param1" };
      const entry2 = { ...testEntry, parameter: "param2" };

      interceptorStore.startAdd(entry1);
      interceptorStore.startAdd(entry2);

      expect(interceptorStore.interceptorExists(entry1)).toBeTruthy();
      expect(interceptorStore.interceptorExists(entry2)).toBeTruthy();
    });
  });

  describe("completeAdd", () => {
    test("should successfully complete adding an interceptor", () => {
      const interceptorId = "test-id";
      interceptorStore.startAdd(testEntry);
      interceptorStore.completeAdd(testEntry, interceptorId, mockHandler);

      expect(interceptorStore.getInterceptorId(testEntry)).toBe(interceptorId);
      expect(interceptorStore.getInterceptorById(interceptorId)).toBe(
        mockInterceptor,
      );
      expect(interceptorStore.getInterceptorHandlerById(interceptorId)).toBe(
        mockHandler,
      );
    });

    test("should throw error when completing add without starting", () => {
      expect(() =>
        interceptorStore.completeAdd(testEntry, "test-id", mockHandler),
      ).toThrow("Interceptor not being added");
    });
  });

  describe("removeInterceptor", () => {
    test("should successfully remove an existing interceptor", () => {
      const interceptorId = "test-id";
      interceptorStore.startAdd(testEntry);
      interceptorStore.completeAdd(testEntry, interceptorId, mockHandler);

      const result = interceptorStore.removeInterceptor(testEntry);

      expect(result).toBeTruthy();
      expect(interceptorStore.interceptorExists(testEntry)).toBeFalsy();
      expect(
        interceptorStore.getInterceptorById(interceptorId),
      ).toBeUndefined();
    });

    test("should return false when removing non-existent interceptor", () => {
      const result = interceptorStore.removeInterceptor(testEntry);
      expect(result).toBeFalsy();
    });
  });

  describe("getInterceptorById", () => {
    test("should return undefined for non-existent interceptor id", () => {
      expect(
        interceptorStore.getInterceptorById("non-existent"),
      ).toBeUndefined();
    });

    test("should return correct interceptor for vgalid id", () => {
      const interceptorId = "test-id";
      interceptorStore.startAdd(testEntry);
      interceptorStore.completeAdd(testEntry, interceptorId, mockHandler);

      expect(interceptorStore.getInterceptorById(interceptorId)).toBe(
        mockInterceptor,
      );
    });
  });

  describe("transformToPartitionKey", () => {
    test("should create correct partition key with parameter", () => {
      const key = InterceptorStore.transformToPartitionKey(
        "testKey",
        "testParam",
      );
      expect(key).toBe("testKey::testParam");
    });

    test("should create correct partition key without parameter", () => {
      const key = InterceptorStore.transformToPartitionKey("testKey");
      expect(key).toBe("testKey::__NoParameter__");
    });
  });

  describe("getInterceptorHandlerById", () => {
    test("should return undefined for non-existent handler id", () => {
      expect(
        interceptorStore.getInterceptorHandlerById("non-existent"),
      ).toBeUndefined();
    });

    test("should return correct handler for valid id", () => {
      const interceptorId = "test-id";
      interceptorStore.startAdd(testEntry);
      interceptorStore.completeAdd(testEntry, interceptorId, mockHandler);

      expect(interceptorStore.getInterceptorHandlerById(interceptorId)).toBe(
        mockHandler,
      );
    });
  });
});

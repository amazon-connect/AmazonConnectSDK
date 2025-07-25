import { translateInterceptorResult } from "./translate-interceptor-result";

describe("translateInterceptorResult", () => {
  const mockInvocationId = "test-invocation-id";

  describe("when result is boolean", () => {
    test("should return success with continue=true when result is true", () => {
      const result = translateInterceptorResult(true, mockInvocationId);

      expect(result).toEqual({
        success: true,
        continue: true,
        invocationId: mockInvocationId,
      });
    });

    test("should return success with continue=false when result is false", () => {
      const result = translateInterceptorResult(false, mockInvocationId);

      expect(result).toEqual({
        success: true,
        continue: false,
        invocationId: mockInvocationId,
      });
    });
  });

  describe("when result is object", () => {
    test("should return success with provided continue value as true", () => {
      const result = translateInterceptorResult(
        { continue: true },
        mockInvocationId,
      );

      expect(result).toEqual({
        success: true,
        continue: true,
        invocationId: mockInvocationId,
      });
    });

    test("should return success with provided continue value as false", () => {
      const result = translateInterceptorResult(
        { continue: false },
        mockInvocationId,
      );

      expect(result).toEqual({
        success: true,
        continue: false,
        invocationId: mockInvocationId,
      });
    });
  });

  describe("when result is invalid", () => {
    test("should return error for null result", () => {
      const result = translateInterceptorResult(
        null as never,
        mockInvocationId,
      );

      expect(result).toEqual({
        success: false,
        error: "invalidInterceptorResult",
        invocationId: mockInvocationId,
      });
    });

    test("should return error for undefined result", () => {
      const result = translateInterceptorResult(
        undefined as never,
        mockInvocationId,
      );

      expect(result).toEqual({
        success: false,
        error: "invalidInterceptorResult",
        invocationId: mockInvocationId,
      });
    });

    test("should return error for object without continue property", () => {
      const result = translateInterceptorResult(
        { someOtherProp: true } as never,
        mockInvocationId,
      );

      expect(result).toEqual({
        success: false,
        error: "invalidInterceptorResult",
        invocationId: mockInvocationId,
      });
    });
  });
});

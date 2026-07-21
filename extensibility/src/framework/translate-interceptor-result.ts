import {
  InterceptorInvocationResult,
  InterceptorResult,
} from "./interceptor-types";

export function translateInterceptorResult(
  result: InterceptorResult,
  invocationId: string,
): InterceptorInvocationResult {
  if (typeof result === "boolean") {
    return { success: true, continue: result, invocationId };
  }

  // Interceptors are user-provided, so guard with typeof before using `in`
  // to avoid a TypeError on truthy primitives (numbers, non-empty strings).
  if (result && typeof result === "object" && "continue" in result) {
    return { success: true, continue: result.continue, invocationId };
  }

  return {
    success: false,
    error: "invalidInterceptorResult",
    invocationId,
  };
}

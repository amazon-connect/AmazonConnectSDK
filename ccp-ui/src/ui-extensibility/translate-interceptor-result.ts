import {
  InterceptorInvocationResult,
  InterceptorResult,
} from "./interceptor-types";

export function translateInterceptorResult(
  result: InterceptorResult,
  invocationId: string,
): InterceptorInvocationResult {
  if (typeof result === "boolean")
    return {
      success: true,
      continue: result,
      invocationId,
    };
  else if (result && Object.keys(result).length > 0) {
    if ("continue" in result) {
      return {
        success: true,
        continue: result.continue,
        invocationId,
      };
    }
  }

  return {
    success: false,
    error: "invalidInterceptorResult",
    invocationId,
  };
}

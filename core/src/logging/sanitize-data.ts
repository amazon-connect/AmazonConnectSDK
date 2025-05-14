import { deepClone } from "../utility/deep-clone";
import { ConnectLogData } from "./logger-types";

export function sanitizeData(
  data: Record<string, unknown> | undefined,
): ConnectLogData | undefined {
  if (!data) return undefined;
  try {
    return deepClone(data);
  } catch {
    return {
      error: "Data failed to sanitize. The original data is not available",
    };
  }
}

import { ConnectError } from "../error";

export function deepClone<T extends object>(object: T): T {
  try {
    return structuredClone(object);
  } catch {
    try {
      // Falls back to JSON parse/stringify if structureClone does not exist
      return JSON.parse(JSON.stringify(object)) as T;
    } catch (cloneError) {
      throw new ConnectError({
        errorKey: "deepCloneFailed",
        details: {
          actualError: cloneError,
        },
      });
    }
  }
}

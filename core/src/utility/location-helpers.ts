export function getOriginAndPath(): { origin: string; path: string } {
  return {
    origin: document?.location?.origin ?? "unknown",
    path: document?.location?.pathname ?? "unknown",
  };
}

import { GlobalResiliencyRegion } from "./global-resiliency-region";

export function verifyRegion(region: GlobalResiliencyRegion): void {
  const validValues = Object.values(GlobalResiliencyRegion);

  if (!validValues.includes(region)) {
    throw new Error(
      `Invalid region: ${region}. Valid regions are: ${validValues.join(", ")}`,
    );
  }
}

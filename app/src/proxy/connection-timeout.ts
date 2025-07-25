import { BaseConfig } from "../config";

export const defaultValue = 5 * 1000;
export const minValue = 1;
export const maxValue = 60 * 1000;

export function getConnectionTimeout(config: BaseConfig): number {
  return Math.max(
    1,
    Math.min(60000, config.workspace?.connectionTimeout ?? 5000),
  );
}

import { BulkInstances } from "../types";
import { Host } from "./host";

export class HostStore<THost extends Host<THost>> {
  private readonly instanceMap: Map<string, THost>;

  constructor() {
    this.instanceMap = new Map();
  }

  set(host: THost): void {
    this.instanceMap.set(host.instanceId, host);
  }

  get(instanceId: string): THost | undefined {
    return this.instanceMap.get(instanceId);
  }
  getBatch(instanceIds: string[]): BulkInstances<THost> {
    return instanceIds
      .map((instanceId) => ({
        instanceId,
        hosts: this.instanceMap.get(instanceId),
      }))
      .reduce(
        (acc, { instanceId, hosts }) =>
          hosts
            ? { ...acc, hosts: [...acc.hosts, hosts] }
            : {
                ...acc,
                missingValues: [...(acc.missingValues ?? []), instanceId],
              },
        { hosts: [] } as BulkInstances<THost>,
      );
  }

  getAll(): THost[] {
    return Array.from(this.instanceMap.values());
  }

  delete(instanceId: string): boolean {
    return this.instanceMap.delete(instanceId);
  }
}

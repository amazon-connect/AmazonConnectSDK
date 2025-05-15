import { Interceptor, InterceptorInvokedHandler } from "./interceptor-types";

export interface InterceptorStoreEntry {
  interceptor: Interceptor;
  interceptorKey: string;
  parameter?: string;
}

export class InterceptorStore {
  private readonly byInterceptorId = new Map<
    string,
    { entry: InterceptorStoreEntry; handler: InterceptorInvokedHandler }
  >();
  private readonly byInterceptorPartitionKey = new Map<
    string,
    Map<Interceptor, string>
  >();

  private static readonly CurrentlyAdding = "__Currently_Adding__";
  private static readonly NoParameter = "__NoParameter__";

  interceptorExists({
    interceptor,
    interceptorKey,
    parameter,
  }: InterceptorStoreEntry): boolean {
    const partition = this.getInterceptorPartitionByKey(
      interceptorKey,
      parameter,
    );

    return partition.has(interceptor);
  }

  startAdd({
    interceptor,
    interceptorKey,
    parameter,
  }: InterceptorStoreEntry): void {
    const partition = this.getInterceptorPartitionByKey(
      interceptorKey,
      parameter,
    );

    if (partition.has(interceptor)) {
      throw new Error("Interceptor already exists");
    }

    partition.set(interceptor, InterceptorStore.CurrentlyAdding);
  }

  completeAdd(
    { interceptor, interceptorKey, parameter }: InterceptorStoreEntry,
    interceptorId: string,
    handler: InterceptorInvokedHandler,
  ): void {
    const partition = this.getInterceptorPartitionByKey(
      interceptorKey,
      parameter,
    );

    if (partition.get(interceptor) !== InterceptorStore.CurrentlyAdding) {
      throw new Error("Interceptor not being added");
    }

    this.byInterceptorId.set(interceptorId, {
      entry: { interceptor, interceptorKey, parameter },
      handler,
    });

    partition.set(interceptor, interceptorId);
  }

  getInterceptorId({
    interceptor,
    interceptorKey,
    parameter,
  }: InterceptorStoreEntry): string | undefined {
    const partition = this.getInterceptorPartitionByKey(
      interceptorKey,
      parameter,
    );
    return partition?.get(interceptor);
  }

  removeInterceptor({
    interceptor,
    interceptorKey,
    parameter,
  }: InterceptorStoreEntry): boolean {
    const partition = this.getInterceptorPartitionByKey(
      interceptorKey,
      parameter,
    );

    const interceptorId = partition.get(interceptor);
    partition.delete(interceptor);

    // TODO Delete when partition is empty

    if (!interceptorId) {
      return false;
    }

    return this.byInterceptorId.delete(interceptorId);
  }

  getInterceptorById(interceptorId: string): Interceptor | undefined {
    return this.byInterceptorId.get(interceptorId)?.entry.interceptor;
  }

  /**
   * Retrieves an interceptor handler by its ID
   * @param interceptorId The unique identifier of the interceptor
   * @returns The interceptor if found, undefined otherwise
   */
  getInterceptorHandlerById(
    interceptorId: string,
  ): InterceptorInvokedHandler | undefined {
    return this.byInterceptorId.get(interceptorId)?.handler;
  }

  private getInterceptorPartitionByKey(
    interceptorKey: string,
    parameter?: string,
  ): Map<Interceptor, string> {
    const partitionKey = InterceptorStore.transformToPartitionKey(
      interceptorKey,
      parameter,
    );

    let partition = this.byInterceptorPartitionKey.get(partitionKey);

    if (!partition) {
      partition = new Map<Interceptor, string>();
      this.byInterceptorPartitionKey.set(partitionKey, partition);
    }

    return partition;
  }

  static transformToPartitionKey(
    interceptorKey: string,
    parameter?: string,
  ): string {
    return `${interceptorKey}::${parameter ?? InterceptorStore.NoParameter}`;
  }
}

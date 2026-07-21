/* eslint-disable @typescript-eslint/no-explicit-any */
import { Interceptor, InterceptorInvokedHandler } from "./interceptor-types";

export interface InterceptorStoreEntry {
  // Widened to Interceptor<any> so entries from `addInterceptor<T>` callers
  // fit without casting. The store only uses referential equality on the
  // function — it never invokes it.
  interceptor: Interceptor<any>;
  interceptorKey: string;
  parameter?: string;
}

export class InterceptorStore {
  private readonly byInterceptorId = new Map<
    string,
    { entry: InterceptorStoreEntry; handler: InterceptorInvokedHandler<any> }
  >();
  private readonly byInterceptorPartitionKey = new Map<
    string,
    Map<Interceptor<any>, string>
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
    handler: InterceptorInvokedHandler<any>,
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
    const id = partition?.get(interceptor);
    // Filter out the in-progress sentinel so callers never see it as a
    // real interceptor id.
    return id === InterceptorStore.CurrentlyAdding ? undefined : id;
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

    if (!interceptorId) {
      return false;
    }

    return this.byInterceptorId.delete(interceptorId);
  }

  getInterceptorById(
    interceptorId: string,
  ): Interceptor<any> | undefined {
    return this.byInterceptorId.get(interceptorId)?.entry.interceptor;
  }

  getInterceptorHandlerById(
    interceptorId: string,
  ): InterceptorInvokedHandler<any> | undefined {
    return this.byInterceptorId.get(interceptorId)?.handler;
  }

  private getInterceptorPartitionByKey(
    interceptorKey: string,
    parameter?: string,
  ): Map<Interceptor<any>, string> {
    const partitionKey = InterceptorStore.transformToPartitionKey(
      interceptorKey,
      parameter,
    );

    let partition = this.byInterceptorPartitionKey.get(partitionKey);

    if (!partition) {
      partition = new Map<Interceptor<any>, string>();
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

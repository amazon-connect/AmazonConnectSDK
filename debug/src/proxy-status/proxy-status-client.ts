import {
  ConnectClient,
  ConnectClientConfig,
  ModuleSubscriptionTopic,
  ProxyConnectionEvent,
  ProxyConnectionStatus,
  ProxySubjectStatus,
  SubscriptionHandler,
} from "@amazon-connect/core";

import { debugNamespace } from "../debug-namespace";
import { engineStatusKey } from "./engine-status-topic";

export type ProxyStatus<
  TSubjectStatus extends ProxySubjectStatus = ProxySubjectStatus,
> = {
  connectionStatus: ProxyConnectionStatus;
  proxyType: string;
  subject: TSubjectStatus;
};

export type ProxyStatusHandler<
  T extends ProxySubjectStatus = ProxySubjectStatus,
> = (status: ProxyStatus<T>) => void;

export class ProxyStatusClient<
  TSubjectStatus extends ProxySubjectStatus = ProxySubjectStatus,
> extends ConnectClient {
  private readonly proxyStatusTopic: ModuleSubscriptionTopic = {
    key: engineStatusKey,
  };

  private readonly handlers: Set<ProxyStatusHandler<TSubjectStatus>> =
    new Set();
  private lastSubjectStatus: TSubjectStatus;
  private readonly subjectChangeHandler: SubscriptionHandler<TSubjectStatus>;
  private readonly connectionStatusHandler: (e: ProxyConnectionEvent) => void;

  constructor(config?: ConnectClientConfig) {
    super(debugNamespace, config);
    this.lastSubjectStatus = {} as TSubjectStatus;

    this.subjectChangeHandler = this.handleSubjectChange.bind(this);
    this.connectionStatusHandler = this.handleConnectionStatusChange.bind(this);
  }

  onProxyStatus(handler: ProxyStatusHandler<TSubjectStatus>): void {
    if (this.handlers.size < 1) {
      this.context.proxy.subscribe(
        this.proxyStatusTopic,
        this.subjectChangeHandler,
      );
      this.context.proxy.onConnectionStatusChange(this.connectionStatusHandler);
    }

    this.handlers.add(handler);
  }

  offProxyStatus(handler: ProxyStatusHandler<TSubjectStatus>): void {
    this.handlers.delete(handler);

    if (this.handlers.size < 1) {
      this.context.proxy.unsubscribe(
        this.proxyStatusTopic,
        this.subjectChangeHandler,
      );
      this.context.proxy.offConnectionStatusChange(
        this.connectionStatusHandler,
      );
    }
  }

  private handleSubjectChange(subjectStatus: TSubjectStatus): Promise<void> {
    this.lastSubjectStatus = subjectStatus;

    const { connectionStatus, proxyType } = this.context.proxy.getProxyInfo();
    const msg: ProxyStatus<TSubjectStatus> = {
      subject: { ...subjectStatus },
      connectionStatus,
      proxyType,
    };
    [...this.handlers].map((handler) => handler(msg));
    return Promise.resolve();
  }

  private handleConnectionStatusChange({
    status: connectionStatus,
  }: ProxyConnectionEvent): void {
    const { proxyType } = this.context.proxy.getProxyInfo();
    const msg: ProxyStatus<TSubjectStatus> = {
      subject: { ...this.lastSubjectStatus },
      proxyType,
      connectionStatus,
    };
    [...this.handlers].map((handler) => handler(msg));
  }
}

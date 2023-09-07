import { AmazonConnectNamespace } from "../amazon-connect-namespace";

export type ConnectRequestData = Record<string, unknown> | void;

export type ConnectRequest<T extends ConnectRequestData = ConnectRequestData> =
  {
    namespace: AmazonConnectNamespace;
    command: string;
    requestId: string | number;
    data: T;
  };

type BaseConnectResponse = {
  namespace: AmazonConnectNamespace;
  requestId: string | number;
};

export type ConnectResponseData = Record<string, unknown> | void;

export type ConnectResponseSuccess<
  T extends ConnectResponseData = ConnectResponseData,
> = BaseConnectResponse & {
  isError: false;
  data: T;
};

export type ConnectResponseError<
  T extends ConnectRequestData = ConnectRequestData,
> = BaseConnectResponse & {
  isError: true;
  errorKey: string;
  reason: string;
  details: { command: string; requestData: T } & Record<string, unknown>;
};

export type ConnectResponse = ConnectResponseSuccess | ConnectResponseError;

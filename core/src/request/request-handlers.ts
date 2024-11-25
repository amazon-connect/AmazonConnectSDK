import { AmazonConnectNamespace } from "../amazon-connect-namespace";

export type ConnectRequestData = object | void;

export type RequestId = string | number;

export type ConnectRequest<T extends ConnectRequestData = ConnectRequestData> =
  {
    namespace: AmazonConnectNamespace;
    command: string;
    requestId: RequestId;
    data: T;
  };

type BaseConnectResponse = {
  namespace: AmazonConnectNamespace;
  requestId: RequestId;
};

export type ConnectResponseData = object | void;

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

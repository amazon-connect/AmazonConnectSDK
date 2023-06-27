import { AmazonConnectProvider } from "./provider";

let _provider: AmazonConnectProvider | undefined;

export function setGlobalProvider(provider: AmazonConnectProvider) {
  if (_provider) throw new Error("Global Provider is already set");

  _provider = provider;
}

export function getGlobalProvider<
  TProvider extends AmazonConnectProvider = AmazonConnectProvider
>(): TProvider {
  if (!_provider) {
    throw new Error(
      "Attempted to get Global AmazonConnectProvider that has not been set."
    );
  }

  return _provider as TProvider;
}

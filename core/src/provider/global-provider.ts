import { AmazonConnectProvider } from "./provider";

let _provider: AmazonConnectProvider | undefined;

export function setGlobalProvider(provider: AmazonConnectProvider): void {
  if (_provider) throw new Error("Global Provider is already set");

  _provider = provider;
}

export function resetGlobalProvider(provider: AmazonConnectProvider): void {
  _provider = provider;
}

export function getGlobalProvider<
  TProvider extends AmazonConnectProvider = AmazonConnectProvider,
>(notSetMessage?: string): TProvider {
  if (!_provider) {
    throw new Error(
      notSetMessage ??
        "Attempted to get Global AmazonConnectProvider that has not been set.",
    );
  }

  return _provider as TProvider;
}

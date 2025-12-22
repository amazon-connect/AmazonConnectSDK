/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { AmazonConnectProvider } from "@amazon-connect/core";

import { AppManager } from "../manager";
import { registerConnection } from "./register-connection";

export type ProviderPrototype<T extends AmazonConnectProvider> = T & {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  constructor: Function & { prototype: T };
};

export function AppManagerPlugin<
  T extends AmazonConnectProvider = AmazonConnectProvider,
>(providerPrototype: ProviderPrototype<T>): ProviderPrototype<T> {
  if (!Object.prototype.hasOwnProperty.call(providerPrototype, "appManager")) {
    Object.defineProperty(providerPrototype, "appManager", {
      get: function () {
        if (!this._appManager) {
          Object.defineProperty(this, "_appManager", {
            value: new AppManager({ provider: this }),
            writable: false,
            enumerable: false,
            configurable: false,
          });

          void registerConnection(this as AmazonConnectProvider);
        }
        return this._appManager;
      },
      enumerable: true,
      configurable: true,
    });
  }

  return providerPrototype;
}

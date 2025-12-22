import { AppHost } from "./app-host";
import { AppHostParams } from "./app-host-params";
import { IFrameAppHost } from "./iframe-app-host";

export function createAppHost(params: AppHostParams): AppHost {
  const { appConfig } = params;

  switch (appConfig._type) {
    case "iframe":
      return new IFrameAppHost(params);
    default:
      throw new Error("Unknown app type");
  }
}

import { AmazonConnectProvider } from "@amazon-connect/core";
import { AppConfig } from "@amazon-connect/workspace-types";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { IFrameRunner } from "../../host";
import { HostStateManager } from "../../host/host-state-manager";
import { AppHostParams } from "./app-host-params";
import { IFrameAppHost } from "./iframe-app-host";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/request/no-result-error");
jest.mock("./app-host-event-relay");
jest.mock("../../app-manager-client");
jest.mock("../../host/iframe-runner");
jest.mock("../../host/host-state-manager");

jest.useFakeTimers();

const arn = "app-arn";
const appName = "app-name";
const appInstanceId = "app-instance-id";
const accessUrl = "http://test.com/iframe.html";
const appConfig = mock<AppConfig>({
  arn,
  name: appName,
  accessUrl,
});
const connectionId = "connection-id";

const provider = mock<AmazonConnectProvider>();
let sut: IFrameAppHost;
let hostStateManagerMock: MockedObject<HostStateManager>;
let iframeRunnerMock: MockedObject<IFrameRunner>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new IFrameAppHost(
    mock<AppHostParams>({
      provider,
      instanceId: appInstanceId,
      connectionId,
      config: appConfig,
    }),
  );

  hostStateManagerMock = mocked(HostStateManager).mock.instances[0];
  iframeRunnerMock = mocked(IFrameRunner).mock.instances[0];
});

describe("constructor", () => {
  test("should create IFrameRunner with data", () => {
    expect(IFrameRunner).toHaveBeenCalledTimes(1);
    expect(IFrameRunner).toHaveBeenCalledWith({
      instanceId: appInstanceId,
      config: appConfig,
      connectionId: connectionId,
      hostStateManager: hostStateManagerMock,
      provider: provider,
    });
  });
});

describe("iframe", () => {
  test("should return iframe", () => {
    const iframe = mock<HTMLIFrameElement>();
    (iframeRunnerMock as { iframe: HTMLIFrameElement }).iframe = iframe;

    const result = sut.iframe;

    expect(result).toEqual(iframe);
  });
});

describe("setIFrame", () => {
  test("should tell iframe runner to set Iframe", () => {
    const testIframe = mock<HTMLIFrameElement>();
    sut.setIFrame(testIframe);

    expect(iframeRunnerMock.setIFrame).toHaveBeenCalledTimes(1);
    expect(iframeRunnerMock.setIFrame).toHaveBeenCalledWith(testIframe, undefined);
  });

  test("should tell iframe runner to set Iframe with options", () => {
    const testIframe = mock<HTMLIFrameElement>();
    const setIframeOptions = {
      disableIframeAllowConfig: true,
      disableIframeSandboxConfig: false,
    };
    
    sut.setIFrame(testIframe, setIframeOptions);

    expect(iframeRunnerMock.setIFrame).toHaveBeenCalledTimes(1);
    expect(iframeRunnerMock.setIFrame).toHaveBeenCalledWith(testIframe, setIframeOptions);
  });
});

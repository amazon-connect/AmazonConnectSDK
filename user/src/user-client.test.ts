import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { userNamespace } from "./namespace";
import { UserRoutes } from "./routes";
import { UserClient } from "./user-client";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: UserClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new UserClient({ context: moduleContextMock });
});

describe("UserClient", () => {
  describe("constructor", () => {
    test("should set correct namespace", () => {
      expect(sut["namespace"]).toEqual(userNamespace);
    });
  });

  describe("getUserRegion", () => {
  test("should make proxy request and return region", async () => {
    const expectedRegion = "us-west-2";
    moduleProxyMock.request.mockResolvedValueOnce({ region: expectedRegion });

    const actualResult = await sut.getUserRegion();

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      UserRoutes.getUserRegion,
    );
    expect(actualResult).toEqual(expectedRegion);
  });

  test("should handle different regions", async () => {
    const expectedRegion = "eu-west-1";
    moduleProxyMock.request.mockResolvedValueOnce({ region: expectedRegion });

    const actualResult = await sut.getUserRegion();

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      UserRoutes.getUserRegion,
    );
    expect(actualResult).toEqual(expectedRegion);
  });

  test("should handle us-east-1 region", async () => {
    const expectedRegion = "us-east-1";
    moduleProxyMock.request.mockResolvedValueOnce({ region: expectedRegion });

    const actualResult = await sut.getUserRegion();

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      UserRoutes.getUserRegion,
    );
    expect(actualResult).toEqual(expectedRegion);
  });

  test("should propagate errors from proxy request", async () => {
    const error = new Error("Failed to get region");
    moduleProxyMock.request.mockRejectedValueOnce(error);

    await expect(sut.getUserRegion()).rejects.toThrow("Failed to get region");

    expect(moduleProxyMock.request).toHaveBeenCalledWith(
      UserRoutes.getUserRegion,
    );
  });
  });

  describe("getUserArn", () => {
    test("should return userArn", async () => {
      const testUserArn = "test-user-arn";
      moduleProxyMock.request.mockResolvedValueOnce({ userArn: testUserArn });

      const result = await sut.getUserArn();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        UserRoutes.getUserArn,
      );
      expect(result).toEqual(testUserArn);
    });
  });

  describe("getInstanceId", () => {
    test("should return Connect instance id", async () => {
      const testInstanceId = "123456789";
      moduleProxyMock.request.mockResolvedValueOnce({
        instanceId: testInstanceId,
      });

      const result = await sut.getInstanceId();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        UserRoutes.getInstanceId,
      );
      expect(result).toEqual(testInstanceId);
    });
  });
});

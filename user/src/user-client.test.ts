import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { userNamespace } from "./namespace";
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
});

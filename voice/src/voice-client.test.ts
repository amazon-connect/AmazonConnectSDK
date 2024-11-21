/* eslint-disable @typescript-eslint/unbound-method */
import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { VoiceRoutes } from "./routes";
import { VoiceClient } from "./voice-client";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: VoiceClient;

beforeEach(jest.resetAllMocks);

describe("VoiceClient", () => {
  beforeEach(() => {
    sut = new VoiceClient({ context: moduleContextMock });
  });

  describe("Requests", () => {
    const testContactId = "CONTACT_ID";

    test("getPhoneNumber returns result", async () => {
      const expectedResult: string = "123";
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ phoneNumber: expectedResult })),
      );

      const actualResult = await sut.getPhoneNumber(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.getPhoneNumber,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });
  });
});

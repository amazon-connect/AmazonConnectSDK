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

    test("getInitialCustomerPhoneNumber returns result", async () => {
      const expectedResult: string = "123";
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ phoneNumber: expectedResult })),
      );

      const actualResult =
        await sut.getInitialCustomerPhoneNumber(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.getInitialCustomerPhoneNumber,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("listDialableCountries returns result", async () => {
      const dialableCountry: DialableCountry = {
        countryCode: "us",
        callingCode: "+1",
        label: "United States of America",
      };
      moduleProxyMock.request.mockResolvedValueOnce([dialableCountry]);

      const actualResult = await sut.listDialableCountries();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.listDialableCountries,
      );
      expect(actualResult).toEqual([dialableCountry]);
    });

    test("createOutboundCall returns result", async () => {
      moduleProxyMock.request.mockResolvedValueOnce({
        contactId: testContactId,
      });

      const actualResult = await sut.createOutboundCall("+11234567890", {
        queueARN: "queue-arn",
      });

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.createOutboundCall,
        {
          phoneNumber: "+11234567890",
          options: {
            queueARN: "queue-arn",
          },
        },
      );
      expect(actualResult).toEqual({
        contactId: testContactId,
      });
    });

    test("getOutboundCallPermission returns result", async () => {
      const expectedResult: boolean = true;
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) =>
          resolve({ outboundCallPermission: expectedResult }),
        ),
      );

      const actualResult = await sut.getOutboundCallPermission();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.getOutboundCallPermission,
      );
      expect(actualResult).toBe(expectedResult);
    });
  });
});

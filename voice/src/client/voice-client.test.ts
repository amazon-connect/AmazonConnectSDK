import { ConnectRequestData, ConnectResponseData, ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";
import { VoiceClient } from "./voice-client";
import {PhoneNumber, VoiceRequests} from "../request";

const currentContact = "CURRENT_CONTACT";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>();

Object.defineProperty(moduleContextMock, "proxy", {
  get() {
    return moduleProxyMock;
  },
});

beforeEach(jest.resetAllMocks);

describe("ContactClient", () => {
  const contactClient = new VoiceClient({
    context: moduleContextMock,
  });

  describe("Requests", () => {
    const testContactId = "CONTACT_ID";
    let requestSpy: jest.SpyInstance<
      Promise<ConnectResponseData>,
      [command: string, data?: ConnectRequestData | undefined],
      unknown
    >;

    beforeEach(() => {
      requestSpy = jest.spyOn(moduleProxyMock, "request");
    });


    test("getPhoneNumber returns result", async () => {
      const expectedResult: PhoneNumber = "123";
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ phoneNumber: expectedResult })),
      );
      const actualResult =
        await contactClient.getPhoneNumber(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(
        VoiceRequests.getPhoneNumber,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });


  });
});


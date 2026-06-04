import { ConnectError, isConnectError } from "@amazon-connect/core";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { aiAgentsNamespace } from "../namespace";
import {
  isAIAgentContactNotConfiguredError,
  isAIAgentContactNotReadyError,
  isAIAgentNotSupportedError,
  isContentNotFoundError,
  isThrottledError,
} from "./error-helpers";

jest.mock("@amazon-connect/core/lib/error");

beforeEach(jest.resetAllMocks);

describe("error-helpers", () => {
  const errorCases = [
    {
      name: "isAIAgentContactNotConfiguredError",
      fn: isAIAgentContactNotConfiguredError,
      errorKey: "AIAgentContactNotConfiguredError",
    },
    {
      name: "isAIAgentNotSupportedError",
      fn: isAIAgentNotSupportedError,
      errorKey: "AIAgentNotSupportedError",
    },
    {
      name: "isAIAgentContactNotReadyError",
      fn: isAIAgentContactNotReadyError,
      errorKey: "AIAgentContactNotReadyError",
    },
    {
      name: "isContentNotFoundError",
      fn: isContentNotFoundError,
      errorKey: "ContentNotFoundException",
    },
    {
      name: "isThrottledError",
      fn: isThrottledError,
      errorKey: "ThrottledException",
    },
  ];

  describe.each(errorCases)("$name", ({ fn, errorKey }) => {
    test("should return true when error matches", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockError = mock<ConnectError>({
        namespace: aiAgentsNamespace,
        errorKey,
      });

      expect(fn(mockError)).toBe(true);
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      expect(fn(new Error("test"))).toBe(false);
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace does not match", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockError = mock<ConnectError>({
        namespace: "wrong.namespace",
        errorKey,
      });

      expect(fn(mockError)).toBe(false);
    });

    test("should return false when errorKey does not match", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockError = mock<ConnectError>({
        namespace: aiAgentsNamespace,
        errorKey: "WrongException",
      });

      expect(fn(mockError)).toBe(false);
    });
  });
});

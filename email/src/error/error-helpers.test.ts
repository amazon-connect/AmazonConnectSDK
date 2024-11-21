import { ConnectError, isConnectError } from "@amazon-connect/core";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { emailNamespace } from "../email-namespace";
import {
  isEmailBodySizeExceededError,
  isOutboundEmailAddressNotConfiguredError,
  isTotalEmailSizeExceededError,
} from "./error-helpers";

jest.mock("@amazon-connect/core/lib/error");

describe("email-helpers", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("isOutboundEmailAddressNotConfiguredError", () => {
    test("should return true when error is a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: emailNamespace,
        errorKey: "OutboundEmailAddressNotConfiguredException",
      });

      const result = isOutboundEmailAddressNotConfiguredError(mockConnectError);

      expect(result).toBeTruthy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      const result = isOutboundEmailAddressNotConfiguredError(
        new Error("test"),
      );

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace is not email", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: "foo",
      });

      const result = isOutboundEmailAddressNotConfiguredError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when error key is not OutboundEmailAddressNotConfiguredException", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: emailNamespace,
        errorKey: "foo",
      });

      const result = isOutboundEmailAddressNotConfiguredError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });
  });

  describe("isEmailBodySizeExceededError", () => {
    test("should return true when error is a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: emailNamespace,
        errorKey: "EmailBodySizeExceededException",
      });

      const result = isEmailBodySizeExceededError(mockConnectError);

      expect(result).toBeTruthy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      const result = isEmailBodySizeExceededError(new Error("test"));

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace is not email", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: "foo",
      });

      const result = isEmailBodySizeExceededError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when error key is not EmailBodySizeExceededException", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: emailNamespace,
        errorKey: "foo",
      });

      const result = isEmailBodySizeExceededError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });
  });

  describe("isTotalEmailSizeExceededError", () => {
    test("should return true when error is a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: emailNamespace,
        errorKey: "TotalEmailSizeExceededException",
      });

      const result = isTotalEmailSizeExceededError(mockConnectError);

      expect(result).toBeTruthy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      const result = isTotalEmailSizeExceededError(new Error("test"));

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace is not email", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: "foo",
      });

      const result = isTotalEmailSizeExceededError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when error key is not TotalEmailSizeExceededException", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: emailNamespace,
        errorKey: "foo",
      });

      const result = isTotalEmailSizeExceededError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });
  });
});

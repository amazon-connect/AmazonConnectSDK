import { ConnectError, isConnectError } from "@amazon-connect/core";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { fileNamespace } from "../file-namespace";
import {
  isInvalidFileNameError,
  isInvalidFileSizeError,
  isInvalidFileTypeError,
  isTotalFileCountExceededError,
  isTotalFileSizeExceededError,
} from "./error-helpers";

jest.mock("@amazon-connect/core/lib/error");

describe("file-error-helpers", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("isInvalidFileNameError", () => {
    test("should return true when error is a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "InvalidFileNameException",
      });

      const result = isInvalidFileNameError(mockConnectError);

      expect(result).toBeTruthy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      const result = isInvalidFileNameError(new Error("test"));

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace is not file", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: "foo",
      });

      const result = isInvalidFileNameError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when error key is not InvalidFileNameException", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "foo",
      });

      const result = isInvalidFileNameError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });
  });

  describe("isInvalidFileTypeError", () => {
    test("should return true when error is a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "InvalidFileTypeException",
      });

      const result = isInvalidFileTypeError(mockConnectError);

      expect(result).toBeTruthy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      const result = isInvalidFileTypeError(new Error("test"));

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace is not file", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: "foo",
      });

      const result = isInvalidFileTypeError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when error key is not InvalidFileTypeException", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "foo",
      });

      const result = isInvalidFileTypeError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });
  });

  describe("isInvalidFileSizeError", () => {
    test("should return true when error is a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "InvalidFileSizeException",
      });

      const result = isInvalidFileSizeError(mockConnectError);

      expect(result).toBeTruthy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      const result = isInvalidFileSizeError(new Error("test"));

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace is not file", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: "foo",
      });

      const result = isInvalidFileSizeError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when error key is not InvalidFileSizeException", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "foo",
      });

      const result = isInvalidFileSizeError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });
  });

  describe("isTotalFileSizeExceededError", () => {
    test("should return true when error is a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "TotalFileSizeExceededException",
      });

      const result = isTotalFileSizeExceededError(mockConnectError);

      expect(result).toBeTruthy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      const result = isTotalFileSizeExceededError(new Error("test"));

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace is not file", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: "foo",
      });

      const result = isTotalFileSizeExceededError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when error key is not TotalFileSizeExceededException", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "foo",
      });

      const result = isTotalFileSizeExceededError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });
  });

  describe("isTotalFileCountExceededError", () => {
    test("should return true when error is a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "TotalFileCountExceededException",
      });

      const result = isTotalFileCountExceededError(mockConnectError);

      expect(result).toBeTruthy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when not a connect error", () => {
      mocked(isConnectError).mockReturnValueOnce(false);

      const result = isTotalFileCountExceededError(new Error("test"));

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when namespace is not file", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: "foo",
      });

      const result = isTotalFileCountExceededError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });

    test("should return false when error key is not TotalFileCountExceededException", () => {
      mocked(isConnectError).mockReturnValueOnce(true);
      const mockConnectError = mock<ConnectError>({
        namespace: fileNamespace,
        errorKey: "foo",
      });

      const result = isTotalFileCountExceededError(mockConnectError);

      expect(result).toBeFalsy();
      expect(isConnectError).toHaveBeenCalledTimes(1);
    });
  });
});

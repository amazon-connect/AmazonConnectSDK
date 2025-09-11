/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { GlobalResiliencyRegion } from "./global-resiliency-region";
import { verifyRegion } from "./verify-region";

describe("verifyRegion", () => {
  describe("when region is valid", () => {
    test("should not throw error for primary region", () => {
      expect(() => verifyRegion(GlobalResiliencyRegion.Primary)).not.toThrow();
    });

    test("should not throw error for secondary region", () => {
      expect(() =>
        verifyRegion(GlobalResiliencyRegion.Secondary),
      ).not.toThrow();
    });
  });

  describe("when region is invalid", () => {
    test("should throw error for null", () => {
      expect(() => verifyRegion(null as any)).toThrow(
        "Invalid region: null. Valid regions are: primary, secondary",
      );
    });

    test("should throw error for undefined", () => {
      expect(() => verifyRegion(undefined as any)).toThrow(
        "Invalid region: undefined. Valid regions are: primary, secondary",
      );
    });

    test("should throw error for empty string", () => {
      expect(() => verifyRegion("" as any)).toThrow(
        "Invalid region: . Valid regions are: primary, secondary",
      );
    });

    test("should throw error for invalid string", () => {
      expect(() => verifyRegion("invalid-region" as any)).toThrow(
        "Invalid region: invalid-region. Valid regions are: primary, secondary",
      );
    });

    test("should throw error for wrong case", () => {
      expect(() => verifyRegion("PRIMARY" as any)).toThrow(
        "Invalid region: PRIMARY. Valid regions are: primary, secondary",
      );
    });

    test("should throw error for number", () => {
      expect(() => verifyRegion(123 as any)).toThrow(
        "Invalid region: 123. Valid regions are: primary, secondary",
      );
    });

    test("should throw error for object", () => {
      expect(() => verifyRegion({} as any)).toThrow(
        "Invalid region: [object Object]. Valid regions are: primary, secondary",
      );
    });

    test("should throw error for array", () => {
      expect(() => verifyRegion([] as any)).toThrow(
        "Invalid region: . Valid regions are: primary, secondary",
      );
    });
  });

  describe("error message format", () => {
    test("should include the invalid value and list of valid values in error message", () => {
      const invalidRegion = "test-region";

      expect(() => verifyRegion(invalidRegion as any)).toThrow(
        `Invalid region: ${invalidRegion}. Valid regions are: primary, secondary`,
      );
    });

    test("should format valid values as comma-separated list", () => {
      expect(() => verifyRegion("invalid" as any)).toThrow(
        /Valid regions are: primary, secondary/,
      );
    });
  });
});

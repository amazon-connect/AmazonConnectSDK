import { sanitizeData } from "./sanitize-data";

describe("sanitizedData", () => {
  let originalStructuredClone: typeof globalThis.structuredClone;

  beforeAll(() => {
    // Store the original structuredClone
    originalStructuredClone = globalThis.structuredClone;
  });

  test("returns undefined when input is undefined", () => {
    expect(sanitizeData(undefined)).toBeUndefined();
  });

  test("returns cloned object for simple data structure", () => {
    const input = { name: "test", value: 123 };
    const result = sanitizeData(input);

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });

  test("handles nested objects correctly", () => {
    const input = {
      user: {
        name: "John",
        details: {
          age: 30,
        },
      },
    };

    const result = sanitizeData(input);
    expect(result).toEqual(input);
    expect(result?.user).not.toBe(input.user);
  });

  test("handles arrays within objects", () => {
    const input = {
      items: [1, 2, 3],
      nested: [{ id: 1 }, { id: 2 }],
    };

    const result = sanitizeData(input);
    expect(result).toEqual(input);
    expect(result?.items).not.toBe(input.items);
  });

  describe("when structuredClone is not available", () => {
    beforeAll(() => {
      // Temporarily remove structuredClone
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).structuredClone;
    });

    test("falls back to JSON parse/stringify ", () => {
      const input = { name: "test", value: 123 };
      const result = sanitizeData(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);

      // Restore structuredClone for other tests
      globalThis.structuredClone = originalStructuredClone;
    });

    test("throws error when not valid JSON stringify input", () => {
      // If an object has a custom .toJSON() method that throws, JSON.stringify() will fail
      const data = {
        toJSON() {
          throw new Error("Custom serialization error");
        },
      };
      const result = sanitizeData(data);
      expect(result).toEqual({
        error: "Data failed to sanitize. The original data is not available",
      });
    });

    afterAll(() => {
      globalThis.structuredClone = originalStructuredClone;
    });
  });

  test("returns return empty object via JSON stringify/parse when not cloneable", () => {
    const input = {
      func: () => console.log("test"),
      symbol: Symbol("test"),
    };

    const result = sanitizeData(input);
    expect(result).toEqual({});
  });
});

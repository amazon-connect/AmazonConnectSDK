/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConnectError } from "../error";
import { deepClone } from "./deep-clone";

describe("deepClone", () => {
  let originalStructuredClone: typeof globalThis.structuredClone;

  beforeAll(() => {
    originalStructuredClone = globalThis.structuredClone;
  });

  beforeEach(() => {
    globalThis.structuredClone = originalStructuredClone;
  });

  afterAll(() => {
    globalThis.structuredClone = originalStructuredClone;
  });

  test("should clone a simple object", () => {
    const original = { a: 1, b: "string", c: true };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  test("should clone nested objects correctly", () => {
    const original = {
      user: {
        name: "John",
        details: {
          age: 30,
        },
      },
    };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned.user).not.toBe(original.user);
    expect(cloned.user.details).not.toBe(original.user.details);
  });

  test("should clone arrays within objects", () => {
    const original = {
      items: [1, 2, 3],
      nested: [{ id: 1 }, { id: 2 }],
    };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned.items).not.toBe(original.items);
    expect(cloned.nested).not.toBe(original.nested);
  });

  describe("when structuredClone is not available", () => {
    beforeAll(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).structuredClone;
    });

    test("should fall back to JSON parse/stringify for simple objects", () => {
      const original = { name: "test", value: 123 };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    test("should throw ConnectError when encountering not cloneable data", () => {
      const notCloneableData = {
        regularData: "test",
        toJSON() {
          throw new Error("Custom serialization error");
        },
      };

      expect(() => deepClone(notCloneableData)).toThrow(ConnectError);
      expect(() => deepClone(notCloneableData)).toThrow("deepCloneFailed");
    });

    afterAll(() => {
      globalThis.structuredClone = originalStructuredClone;
    });
  });

  test("should handle circular references using structuredClone", () => {
    const original: any = { a: 1 };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    original.self = original;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(cloned.self).toBe(cloned);
  });
});

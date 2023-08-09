import { webcrypto } from "crypto";

import { generateStringId, generateUUID } from "./id-generator";

beforeAll(() => {
  global.crypto = {
    ...global.crypto,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    getRandomValues: (arr) => webcrypto.getRandomValues(arr as any),
    randomUUID: () => webcrypto.randomUUID(),
  };
});

describe("generateStringId", () => {
  test("should have length of 1", () => {
    const result = generateStringId(1);

    expect(result).toHaveLength(1);
  });

  test("should have length of 9", () => {
    const result = generateStringId(9);

    expect(result).toHaveLength(9);
  });

  test("should have length of 10", () => {
    const result = generateStringId(10);

    expect(result).toHaveLength(10);
  });

  test("should have length of 53", () => {
    const result = generateStringId(53);

    expect(result).toHaveLength(53);
  });

  test("should only contain hex characters", () => {
    const result = generateStringId(30);
    const hexValues = [..."0123456789abcdef"];

    expect([...result].every((r) => hexValues.includes(r))).toBeTruthy();
  });

  test("should not contain the same value in every position", () => {
    const result = generateStringId(30);
    const counts = [...result].reduce((a, e) => {
      a[e] = a[e] ? a[e] + 1 : 1;
      return a;
    }, {} as Record<string, number>);

    expect(Object.values(counts).includes(result.length)).toBeFalsy();
  });
});

describe("generateUUID", () => {
  test("should match UUID regex", () => {
    const regex =
      /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
    const result = generateUUID();
    expect(result).toMatch(regex);
  });
});

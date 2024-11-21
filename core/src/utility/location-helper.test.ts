import { mock } from "jest-mock-extended";

import { getOriginAndPath } from "./location-helpers";

let originalDocument: Document;

beforeAll(() => {
  originalDocument = global.document;
});

afterEach(() => {
  global.document = originalDocument;
});

describe("getOriginAndPath", () => {
  describe("when document.location is defined", () => {
    test("should return origin and path", () => {
      const origin = "https://test.com";
      const path = "/path";
      global.document = {
        ...originalDocument,
        location: mock<Location>({ origin, pathname: path }),
      };

      const result = getOriginAndPath();

      expect(result.origin).toEqual(origin);
      expect(result.path).toEqual(path);
    });
  });

  describe("when document is not defined", () => {
    test("should return origin and path as unknown", () => {
      (global as { document?: unknown }).document = undefined;

      const result = getOriginAndPath();

      expect(result.origin).toEqual("unknown");
      expect(result.path).toEqual("unknown");
    });
  });

  describe("when document.location is not defined", () => {
    test("should return origin and path as unknown", () => {
      global.document = {
        ...originalDocument,
        location: undefined as unknown as Location,
      };

      const result = getOriginAndPath();

      expect(result.origin).toEqual("unknown");
      expect(result.path).toEqual("unknown");
    });
  });
});

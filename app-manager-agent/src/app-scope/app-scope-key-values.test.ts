import { getContactScopeKey } from "./app-scope-key-values";

describe("getContactScopeKey", () => {
  test("should prepend the prefix onto the contact id", () => {
    const contactId = "abcdefgh";

    const result = getContactScopeKey(contactId);

    expect(result).toBe(`contact-${contactId}`);
  });
});

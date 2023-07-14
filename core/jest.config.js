/** @type {import('ts-jest').JestConfigWithTsJest} */
const { webcrypto } = require("crypto");

module.exports = {
  testEnvironment: "node",
  globals: {
    crypto: {
      getRandomValues: (arr) => webcrypto.getRandomValues(arr),
      randomUUID: () => webcrypto.randomUUID(),
    },
  },
};

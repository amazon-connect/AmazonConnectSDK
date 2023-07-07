/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  globals: {
    crypto: {
      getRandomValues: (arr) => require("crypto").webcrypto.getRandomValues(arr),
      randomUUID: () => require("crypto").webcrypto.randomUUID(),
    }
  }
};
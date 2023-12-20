/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "jsdom",
  reporters: ["default"],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/'
  ]
};

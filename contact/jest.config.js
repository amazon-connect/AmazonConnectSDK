/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  testEnvironment: "node",
  coverageDirectory: "build/brazil-documentation/coverage",
  reporters: ["default", ["@amzn/jest-reporter", { language: "typescript" }]],
};

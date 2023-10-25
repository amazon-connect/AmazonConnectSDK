/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "jsdom",
  coverageDirectory: "build/brazil-documentation/coverage",
  reporters: ["default", ["@amzn/jest-reporter", { language: "typescript" }]],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/'
  ]
};

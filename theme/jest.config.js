const baseConfig = require("../jest.config.base");

module.exports = {
  ...baseConfig,
  testEnvironment: "jsdom",
  transformIgnorePatterns: ["node_modules/(?!(@amazon-connect|@cloudscape-design))"],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    "^@cloudscape-design/components/theming$": "<rootDir>/__mocks__/cloudscape-theming.js",
    "^@cloudscape-design/theming-runtime$": "<rootDir>/__mocks__/cloudscape-theming-runtime.js",
    "^@cloudscape-design/global-styles$": "<rootDir>/__mocks__/cloudscape-global-styles.js"
  }
};

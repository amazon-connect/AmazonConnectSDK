/** @type {import('jest').Config} */
module.exports = {
  moduleNameMapper: {
    "^@amazon-connect/(.+)$": "<rootDir>/../$1"
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: false,
          },
          target: "es2021",
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!@amazon-connect)"],
  testPathIgnorePatterns: ["/node_modules/", "/lib/", "/lib-esm/", "/build/"],
};
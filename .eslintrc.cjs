module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./*/tsconfig.json"],
  },
  plugins: ["prettier", "@typescript-eslint", "simple-import-sort"],
  root: true,
  rules: {
    "@typescript-eslint/no-import-type-side-effects": "error",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "prettier/prettier": "error",
    "arrow-body-style": "off",
    "prefer-arrow-callback": "off",
  },
};

// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const prettier = require("eslint-config-prettier");
const simpleImportSort = require("eslint-plugin-simple-import-sort");

module.exports = [
  eslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Browser globals
        navigator: "readonly",
        window: "readonly",
        document: "readonly",
        HTMLElement: "readonly",
        HTMLIFrameElement: "readonly",
        HTMLAudioElement: "readonly",
        Document: "readonly",
        Window: "readonly",
        WindowProxy: "readonly",
        Location: "readonly",
        URL: "readonly",
        MessageEvent: "readonly",
        MessagePort: "readonly",
        MessageChannel: "readonly",
        Audio: "readonly",
        Event: "readonly",
        EventListener: "readonly",
        KeyboardEvent: "readonly",
        MediaDeviceInfo: "readonly",
        MediaStream: "readonly",
        MediaStreamConstraints: "readonly",
        MediaStreamTrack: "readonly",
        SharedWorker: "readonly",
        Worker: "readonly",
        addEventListener: "readonly",
        self: "readonly",
        crypto: "readonly",
        Crypto: "readonly",
        AbortController: "readonly",
        PageTransitionEvent: "readonly",
        Transferable: "readonly",
        performance: "readonly",
        structuredClone: "readonly",
        // TypeScript/Node.js types
        NodeJS: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-import-type-side-effects": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
      "no-console": "error",
      // Allow unused vars in enum definitions (routes, topic-keys)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          args: "after-used",
        },
      ],
      // TypeScript strict rules - enforce by default, disable only with explicit comments
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/prefer-promise-reject-errors": "error",
      "@typescript-eslint/no-var-requires": "error",
      // Disable expensive import rules that cause performance issues in monorepos
      "import/no-cycle": "off",
      "import/no-deprecated": "off",
    },
  },
  // Jest test files configuration
  {
    files: ["**/*.test.{js,ts,tsx}", "**/test/**/*.{js,ts,tsx}"],
    languageOptions: {
      globals: {
        // Jest globals
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        fail: "readonly",
        // Node.js globals for test environment
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        // Browser globals for test environment
        HTMLElement: "readonly",
        HTMLIFrameElement: "readonly",
        Document: "readonly",
        Window: "readonly",
        WindowProxy: "readonly",
        Location: "readonly",
        URL: "readonly",
        MessageEvent: "readonly",
        MessagePort: "readonly",
        NodeJS: "readonly",
      },
    },
    rules: {
      // Allow unbound methods in test files for mocking
      "@typescript-eslint/unbound-method": "off",
    },
  },
  // Allow console in specific files
  {
    files: ["test-report.js"],
    rules: {
      "no-console": "off",
    },
  },
  prettier,
  {
    ignores: [
      // Build output directories
      "**/lib/**",
      "**/lib-esm/**",
      "**/build/**",
      "**/dist/**",

      // Coverage and test reports
      "**/coverage/**",

      // Node modules
      "**/node_modules/**",

      // Configuration files
      "**/*.config.js",
      "**/babel.config.js",
      "**/jest.config.js",
      "**/webpack.config.js",
      "**/rollup.config.js",
      "**/vite.config.js",

      // TypeScript configuration files
      "**/tsconfig.json",
      "**/tsconfig.*.json",

      // Package lock files
      "**/package-lock.json",
      "**/yarn.lock",
      "**/pnpm-lock.yaml",

      // IDE and editor files
      "**/.vscode/**",
      "**/.idea/**",

      // Git files
      "**/.git/**",

      // Temporary files
      "**/.tmp/**",
      "**/tmp/**",

      // Log files
      "**/*.log",

      // Environment files
      "**/.env*",

      // Cache directories
      "**/.cache/**",
      "**/.eslintcache",

      // OS generated files
      "**/.DS_Store",
      "**/Thumbs.db",

      // Mock files
      "**/__mocks__/**",
    ],
  },
];

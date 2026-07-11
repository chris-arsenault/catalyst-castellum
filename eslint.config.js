import js from "@eslint/js";
import {
  maxJsxProps,
  noDirectFetch,
  noDirectStoreImport,
  noEscapeHatches,
  noInlineStyles,
  noJsFileExtension,
  noManualAsyncState,
  noManualExpandState,
  noManualViewHeader,
  noNonVitestTesting,
  noRawUndefinedUnion,
} from "@ahara/standards/eslint-rules";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactPerf from "eslint-plugin-react-perf";
import reactRefresh from "eslint-plugin-react-refresh";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

const localRules = {
  "max-jsx-props": maxJsxProps,
  "no-direct-fetch": noDirectFetch,
  "no-direct-store-import": noDirectStoreImport,
  "no-escape-hatches": noEscapeHatches,
  "no-inline-styles": noInlineStyles,
  "no-js-file-extension": noJsFileExtension,
  "no-manual-async-state": noManualAsyncState,
  "no-manual-expand-state": noManualExpandState,
  "no-manual-view-header": noManualViewHeader,
  "no-non-vitest-testing": noNonVitestTesting,
  "no-raw-undefined-union": noRawUndefinedUnion,
};

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      "coverage/",
      "playwright-report/",
      "test-results/",
      ".terraform/",
    ],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      complexity: ["error", 10],
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 75, skipBlankLines: true, skipComments: true }],
      "max-depth": ["warn", 4],
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react-perf": reactPerf,
      "jsx-a11y": jsxA11y,
      local: { rules: localRules },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-unused-vars": "off",
      "react-perf/jsx-no-new-array-as-prop": ["warn", { nativeAllowList: "all" }],
      "react-perf/jsx-no-new-function-as-prop": ["warn", { nativeAllowList: "all" }],
      "react-perf/jsx-no-new-object-as-prop": ["warn", { nativeAllowList: "all" }],
      "local/max-jsx-props": ["warn", { max: 12 }],
      "local/no-direct-fetch": "error",
      "local/no-direct-store-import": "warn",
      "local/no-escape-hatches": "error",
      "local/no-inline-styles": "error",
      "local/no-js-file-extension": "error",
      "local/no-manual-async-state": "warn",
      "local/no-manual-expand-state": "warn",
      "local/no-manual-view-header": "warn",
      "local/no-non-vitest-testing": "error",
      "local/no-raw-undefined-union": "warn",
    },
  },
  {
    files: ["src/components/gameMap/**/*.tsx"],
    rules: {
      // Pixi JSX configures GPU scene objects, not DOM properties or CSS.
      "react/no-unknown-property": "off",
      "local/no-inline-styles": "off",
    },
  },
  sonarjs.configs.recommended,
  prettier
);

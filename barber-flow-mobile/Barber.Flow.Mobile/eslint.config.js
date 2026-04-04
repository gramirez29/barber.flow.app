/**
 * ESLint flat config for Barber Flow Mobile
 * - TypeScript + React Native
 * - Uses recommended rules from ESLint, @typescript-eslint, react, react-hooks, and react-native
 *
 * Note: ensure the following devDependencies are installed in the mobile package.json:
 *  - eslint
 *  - @typescript-eslint/parser
 *  - @typescript-eslint/eslint-plugin
 *  - eslint-plugin-react
 *  - eslint-plugin-react-hooks
 *  - eslint-plugin-react-native
 *  - eslint-plugin-import (optional)
 */

const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const hooksPlugin = require("eslint-plugin-react-hooks");
// react-native plugin intentionally left out to avoid compatibility issues with ESLint v10

module.exports = [
  {
    ignores: ["node_modules/**", "**/dist/**", "ios/**", "android/**"],
  },

  // TypeScript + React files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: { "@typescript-eslint": tsPlugin, react: reactPlugin, "react-hooks": hooksPlugin },
    settings: { react: { version: "detect" } },
    rules: {
      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",

      // TypeScript
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",

      // React
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      // Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Native-specific rules are not enforced here to avoid plugin compatibility issues with ESLint v10.

      // Import/order style (if plugin available)
      // "import/order": ["warn", { groups: [["builtin", "external"], ["internal", "parent", "sibling", "index"]] }],
    },
  },

  // JavaScript files (fallback)
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react: reactPlugin, "react-hooks": hooksPlugin },
    settings: { react: { version: "detect" } },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

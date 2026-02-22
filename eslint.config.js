import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  // Base JS recommended
  js.configs.recommended,

  // TypeScript recommended
  ...tseslint.configs.recommended,

  // React hooks rules (flat-config compatible)
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Project-wide overrides
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-console": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],  // empty catch {} is fine
      "no-useless-assignment": "off",                    // false positives with let + try/catch
    },
  },

  // Ignore patterns
  {
    ignores: [
      "build/**",
      "node_modules/**",
      ".wrangler/**",
      "public/**",
      "worker-entry.js",
      "postcss.config.js",
    ],
  }
);

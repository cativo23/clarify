// eslint.config.js - Flat config format for ESLint 9.x
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import vuePlugin from "eslint-plugin-vue";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  // Ignored files - exclude auto-generated and unnecessary files
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "**/*.md",
      ".git/**",
      "tests/**",
      "test/**",
      ".nuxt/**",
      ".output/**",
      ".vercel/**",
      "vendor/**",
    ],
  },

  // Base configuration for all files
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      "prettier/prettier": "error",
    },
  },

  // TypeScript configuration (without type-checking for speed)
  {
    files: ["**/*.{ts,mts,cts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      ...tsPlugin.configs.recommended.rules,
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    },
  },

  // Vue SFC configuration
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      vue: vuePlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      ...vuePlugin.configs.recommended.rules,
      "prettier/prettier": "error",
      "vue/no-unused-vars": "error",
      "vue/no-unused-components": "error",
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
      "vue/attribute-hyphenation": ["error", "always"],
      "vue/no-undef-components": "warn", // Nuxt auto-imports components
      "vue/define-macros-order": [
        "error",
        {
          order: ["defineOptions", "defineProps", "defineEmits", "defineSlots"],
        },
      ],
    },
  },

  // Nuxt specific configuration
  {
    files: ["**/*.{ts,vue}"],
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // Scripts (relaxed rules)
  {
    files: ["scripts/**/*.{ts,js}"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "no-console": "off",
    },
  },

  // Server files
  {
    files: ["server/**/*.{ts,js}"],
    rules: {
      "no-console": "off",
    },
  },
];

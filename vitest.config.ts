import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";

const root = resolve(__dirname, ".");

const sharedAlias = {
  "~": root,
  "@": root,
};

const sharedTest = {
  environment: "happy-dom" as const,
  globals: true,
  setupFiles: ["./tests/setup.ts"],
  server: {
    deps: {
      inline: ["@nuxt/test-utils"],
    },
  },
};

export default defineConfig({
  plugins: [vue()] as any,
  test: {
    projects: [
      {
        plugins: [vue()] as any,
        test: {
          ...sharedTest,
          name: "unit",
          include: [
            "tests/unit/**/*.{test,spec}.ts",
            "tests/components/**/*.{test,spec}.ts",
          ],
        },
        resolve: {
          alias: {
            ...sharedAlias,
            // Mock the Nuxt-injected Supabase server helper. Unit tests stub
            // auth/DB responses — they do not touch a real Supabase instance.
            "#supabase/server": resolve(root, "./tests/mocks/supabase.ts"),
          },
        },
      },
      {
        plugins: [vue()] as any,
        test: {
          ...sharedTest,
          name: "integration",
          include: ["tests/integration/**/*.{test,spec}.ts"],
        },
        resolve: {
          alias: sharedAlias,
          // No #supabase/server alias here. Integration tests must either
          // mock @supabase/supabase-js explicitly (current pattern) or run
          // against a real Supabase instance via env vars. Falsely aliasing
          // the helper would silently turn integration tests into unit tests.
        },
      },
    ],
  },
});

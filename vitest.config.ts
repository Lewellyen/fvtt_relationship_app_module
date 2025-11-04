import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        dev: true,
        compatibility: { componentApi: 4 },
        runes: true,
      },
    }),
    tsconfigPaths(),
  ],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,svelte}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      include: ["src/**/*.ts"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.ts",
        "**/*.spec.ts",
        // Pure type/interface files
        "src/**/interfaces/**",
        "src/types/**",
        "src/foundry/types.ts",
        "src/di_infrastructure/types/containererrorcode.ts",
        "src/di_infrastructure/types/containervalidationstate.ts",
        "src/di_infrastructure/types/injectiontoken.ts",
        "src/di_infrastructure/types/serviceclass.ts",
        "src/di_infrastructure/types/servicedependencies.ts",
        "src/di_infrastructure/types/servicefactory.ts",
        "src/core/module-api.ts",
        // Non-executable infrastructure
        "src/polyfills/**",
        "src/svelte/**",
        "src/custom.d.ts",
        "programming_learning_examples/**",
      ],
    },
  },
});

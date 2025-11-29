process.env.ROLLUP_SKIP_NODE_NATIVE = "true";

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
    watch: false, // Disable watch mode by default (use test:watch for interactive mode)
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/framework/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,svelte}"],
    nodeOptions: {
      exposeGc: true,
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      include: ["src/**/*.ts"],
      exclude: [
        "node_modules/",
        // Test setup & utilities (no need to test test code)
        "src/framework/test/**",
        "src/test/**",
        // Test files
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/__tests__/**",
        // Pure type/interface files (no runtime code)
        "src/**/interfaces/**",
        "**/*.interface.ts",
        "src/domain/types/result.ts",
        "src/domain/entities/**",
        "src/infrastructure/adapters/foundry/types.ts",
        "src/infrastructure/di/interfaces.ts",
        "src/infrastructure/di/types/index.ts",
        "src/infrastructure/di/types/core/injectiontoken.ts",
        "src/infrastructure/di/types/errors/**",
        "src/infrastructure/di/types/resolution/**",
        "src/infrastructure/shared/tokens/index.ts",
        "src/framework/types/**",
        "src/framework/core/api/module-api.ts",
        // Type utilities and edge-case helpers
        "src/framework/config/environment.ts",
        "src/infrastructure/adapters/foundry/runtime-casts.ts",
        "src/infrastructure/di/types/utilities/runtime-safe-cast.ts",
        // Non-executable infrastructure
        "src/infrastructure/shared/polyfills/**",
        "programming_learning_examples/**",
        // Type-only files (no runtime code)
        "src/application/services/JournalVisibilityConfig.ts",
        "src/domain/types/cache/cache-types.ts",
        "src/application/tokens/index.ts",
        // Re-export files (no runtime code)
        "src/infrastructure/shared/utils/result.ts",
        "src/infrastructure/shared/tokens/collection-tokens.ts",
        "src/infrastructure/shared/tokens/repository-tokens.ts",
      ],
    },
  },
});

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
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,svelte}"],
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
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.ts",
        "**/*.spec.ts",
        // Pure type/interface files
        "src/**/interfaces/**",
        "**/*.interface.ts", // Interface files with no runtime code
        "src/types/**",
        "src/foundry/types.ts",
        "src/config/environment.ts",
        "src/di_infrastructure/types/containererrorcode.ts",
        "src/di_infrastructure/types/containervalidationstate.ts",
        "src/di_infrastructure/types/injectiontoken.ts",
        "src/di_infrastructure/types/serviceclass.ts",
        "src/di_infrastructure/types/servicedependencies.ts",
        "src/di_infrastructure/types/servicefactory.ts",
        "src/core/module-api.ts",
        // Bootstrap/Foundry-Entry-Point: stark umgebungsabhängig, wird über Integrationspfade geprüft
        "src/core/init-solid.ts",
        // Non-executable infrastructure
        "src/polyfills/**",
        "src/svelte/**",
        "src/custom.d.ts",
        "programming_learning_examples/**",
      ],
    },
  },
});

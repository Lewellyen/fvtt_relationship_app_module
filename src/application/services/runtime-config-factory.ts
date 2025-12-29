import type { EnvironmentConfig } from "@/domain/types/environment-config";
import { RuntimeConfigService } from "./RuntimeConfigService";
import { RuntimeConfigStore } from "./RuntimeConfigStore";
import { RuntimeConfigEventEmitter } from "./RuntimeConfigEventEmitter";
import type { IRuntimeConfigStore } from "./RuntimeConfigStore";
import type { IRuntimeConfigEventEmitter } from "./RuntimeConfigEventEmitter";

/**
 * Factory function for creating RuntimeConfigService instances.
 *
 * Centralizes the creation of RuntimeConfigService to follow the Dependency Inversion Principle (DIP).
 * This allows for easier testing (mocking) and future extensions (caching, pooling, etc.).
 *
 * **Usage:**
 * ```typescript
 * import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
 * import type { EnvironmentConfig } from "@/domain/types/environment-config";
 * // ENV should be obtained from domain layer or passed as parameter
 *
 * const config = createRuntimeConfig(envConfig);
 * ```
 *
 * @param env - The environment configuration to use
 * @param store - Optional store implementation (defaults to RuntimeConfigStore)
 * @param emitter - Optional emitter implementation (defaults to RuntimeConfigEventEmitter)
 * @returns A new RuntimeConfigService instance
 */
export function createRuntimeConfig(
  env: EnvironmentConfig,
  store?: IRuntimeConfigStore,
  emitter?: IRuntimeConfigEventEmitter
): RuntimeConfigService {
  return new RuntimeConfigService(
    store ?? new RuntimeConfigStore(env),
    emitter ?? new RuntimeConfigEventEmitter()
  );
}

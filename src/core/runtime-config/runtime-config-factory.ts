import type { EnvironmentConfig } from "@/config/environment";
import { RuntimeConfigService } from "./runtime-config.service";

/**
 * Factory function for creating RuntimeConfigService instances.
 *
 * Centralizes the creation of RuntimeConfigService to follow the Dependency Inversion Principle (DIP).
 * This allows for easier testing (mocking) and future extensions (caching, pooling, etc.).
 *
 * **Usage:**
 * ```typescript
 * import { createRuntimeConfig } from "@/core/runtime-config/runtime-config-factory";
 * import { ENV } from "@/config/environment";
 *
 * const config = createRuntimeConfig(ENV);
 * ```
 *
 * @param env - The environment configuration to use
 * @returns A new RuntimeConfigService instance
 */
export function createRuntimeConfig(env: EnvironmentConfig): RuntimeConfigService {
  return new RuntimeConfigService(env);
}

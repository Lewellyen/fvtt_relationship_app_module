import type { EnvironmentConfig } from "@/domain/types/environment-config";
import { RuntimeConfigService } from "./RuntimeConfigService";

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
 * import { ENV } from "@/framework/config/environment";
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

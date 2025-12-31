import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";
import { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
import type { EnvironmentConfig } from "@/domain/types/environment-config";

/**
 * Infrastructure adapter that wraps RuntimeConfigService as PlatformRuntimeConfigPort.
 */
export class RuntimeConfigAdapter implements PlatformRuntimeConfigPort {
  private readonly service: RuntimeConfigService;

  constructor(env: EnvironmentConfig) {
    this.service = createRuntimeConfig(env);
  }

  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K] {
    return this.service.get(key);
  }

  setFromPlatform<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    this.service.setFromPlatform(key, value);
  }

  onChange<K extends RuntimeConfigKey>(
    key: K,
    listener: (value: RuntimeConfigValues[K]) => void
  ): () => void {
    return this.service.onChange(key, listener);
  }
}

/**
 * Factory function for creating RuntimeConfigAdapter instances.
 *
 * Centralizes the creation of RuntimeConfigAdapter to follow the Dependency Inversion Principle (DIP).
 * This allows the Framework layer to create instances without directly importing the concrete class,
 * improving testability and reducing coupling.
 *
 * **Usage:**
 * ```typescript
 * import { createRuntimeConfigAdapter } from "@/infrastructure/config/runtime-config-adapter";
 * import type { EnvironmentConfig } from "@/domain/types/environment-config";
 *
 * const adapter = createRuntimeConfigAdapter(envConfig);
 * ```
 *
 * @param env - The environment configuration to use
 * @returns A new RuntimeConfigAdapter instance
 */
export function createRuntimeConfigAdapter(env: EnvironmentConfig): RuntimeConfigAdapter {
  return new RuntimeConfigAdapter(env);
}

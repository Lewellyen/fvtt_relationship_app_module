import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";
import { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { EnvironmentConfig } from "@/domain/types/environment-config";

/**
 * Infrastructure adapter that wraps RuntimeConfigService as PlatformRuntimeConfigPort.
 */
export class RuntimeConfigAdapter implements PlatformRuntimeConfigPort {
  private readonly service: RuntimeConfigService;

  constructor(env: EnvironmentConfig) {
    this.service = new RuntimeConfigService(env);
  }

  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K] {
    return this.service.get(key);
  }

  setFromPlatform<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    this.service.setFromFoundry(key, value);
  }

  onChange<K extends RuntimeConfigKey>(
    key: K,
    listener: (value: RuntimeConfigValues[K]) => void
  ): () => void {
    return this.service.onChange(key, listener);
  }
}

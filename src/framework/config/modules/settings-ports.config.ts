import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { platformSettingsPortToken } from "@/application/tokens/domain-ports.tokens";
import { DIFoundrySettingsAdapter } from "@/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter";

/**
 * Registers settings port services.
 *
 * Services registered:
 * - PlatformSettingsPort (singleton) - Platform-agnostic settings handling
 *
 * DESIGN: Settings ports are platform-agnostic abstractions over settings systems.
 * They enable multi-VTT support by decoupling from Foundry-specific APIs.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerSettingsPorts(container: ServiceContainer): Result<void, string> {
  // Register PlatformSettingsPort (Foundry implementation)
  const settingsPortResult = container.registerClass(
    platformSettingsPortToken,
    DIFoundrySettingsAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsPortResult)) {
    return err(`Failed to register PlatformSettingsPort: ${settingsPortResult.error.message}`);
  }

  return ok(undefined);
}

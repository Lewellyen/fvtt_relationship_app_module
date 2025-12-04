import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { moduleSettingsRegistrarToken } from "@/infrastructure/shared/tokens/core.tokens";
import { DIModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";

/**
 * Registers registrar services.
 *
 * Services registered:
 * - ModuleSettingsRegistrar (singleton) - Manages all settings
 *
 * NOTE: Event listeners are now registered via registerEventPorts() in event-ports.config.ts.
 * This separation improves modularity and follows Single Responsibility Principle.
 *
 * DESIGN: Registrars are DI services that can be resolved when needed.
 * They are NOT instantiated with 'new' in business logic.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerRegistrars(container: ServiceContainer): Result<void, string> {
  // Register ModuleSettingsRegistrar
  const settingsRegistrarResult = container.registerClass(
    moduleSettingsRegistrarToken,
    DIModuleSettingsRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsRegistrarResult)) {
    return err(
      `Failed to register ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
    );
  }

  return ok(undefined);
}

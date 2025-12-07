import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { moduleSettingsRegistrarToken } from "@/infrastructure/shared/tokens/core/module-settings-registrar.token";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import type { ModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";

/**
 * Orchestrator for registering module settings during bootstrap.
 *
 * Responsibilities:
 * - Resolve ModuleSettingsRegistrar
 * - Register all module settings
 */
export class SettingsBootstrapper {
  /**
   * Registers all module settings.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error
   */
  static registerSettings(container: PlatformContainerPort): Result<void, string> {
    const settingsRegistrarResult = container.resolveWithError(moduleSettingsRegistrarToken);
    if (!settingsRegistrarResult.ok) {
      return err(
        `Failed to resolve ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
      );
    }

    // Container parameter removed - all dependencies injected via constructor
    const settingsRegistrar = castResolvedService<ModuleSettingsRegistrar>(
      settingsRegistrarResult.value
    );
    settingsRegistrar.registerAll();
    return ok(undefined);
  }
}

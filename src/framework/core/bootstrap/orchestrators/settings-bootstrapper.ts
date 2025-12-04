import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import { moduleSettingsRegistrarToken } from "@/infrastructure/shared/tokens/core.tokens";
import { castModuleSettingsRegistrar } from "@/infrastructure/di/types/utilities/runtime-safe-cast";

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
   * @param container - ContainerPort for service resolution
   * @returns Result indicating success or error
   */
  static registerSettings(container: ContainerPort): Result<void, string> {
    const settingsRegistrarResult = container.resolveWithError(moduleSettingsRegistrarToken);
    if (!settingsRegistrarResult.ok) {
      return err(
        `Failed to resolve ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
      );
    }

    // Container parameter removed - all dependencies injected via constructor
    const settingsRegistrar = castModuleSettingsRegistrar(settingsRegistrarResult.value);
    settingsRegistrar.registerAll();
    return ok(undefined);
  }
}

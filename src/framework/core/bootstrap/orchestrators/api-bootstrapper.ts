import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { moduleApiInitializerToken } from "@/infrastructure/shared/tokens/infrastructure.tokens";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import type { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";

/**
 * Orchestrator for exposing module API during bootstrap.
 *
 * Responsibilities:
 * - Resolve ModuleApiInitializer
 * - Expose API to game.modules.get(MODULE_ID).api
 */
export class ApiBootstrapper {
  /**
   * Exposes the module's public API.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error
   */
  static exposeApi(container: PlatformContainerPort): Result<void, string> {
    const apiInitializerResult = container.resolveWithError(moduleApiInitializerToken);
    if (!apiInitializerResult.ok) {
      return err(`Failed to resolve ModuleApiInitializer: ${apiInitializerResult.error.message}`);
    }

    const apiInitializer = castResolvedService<ModuleApiInitializer>(apiInitializerResult.value);
    const exposeResult = apiInitializer.expose(container);
    if (!exposeResult.ok) {
      return err(`Failed to expose API: ${exposeResult.error}`);
    }

    return ok(undefined);
  }
}

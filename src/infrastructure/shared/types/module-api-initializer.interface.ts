import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { Result } from "@/domain/types/result";

/**
 * Interface for module API initialization.
 * Extracted from Framework layer to avoid Infrastructure → Framework dependency.
 */
export interface ModuleApiInitializer {
  /**
   * Exposes the module's public API to game.modules.get(MODULE_ID).api
   */
  expose(container: PlatformContainerPort): Result<void, string>;
}

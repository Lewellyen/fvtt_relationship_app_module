import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { Result } from "@/domain/types/result";

/**
 * Framework-layer interface for module API initialization.
 */
export interface ModuleApiInitializerPort {
  expose(container: PlatformContainerPort): Result<void, string>;
}

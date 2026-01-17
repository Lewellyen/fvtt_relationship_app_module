import type { Result } from "@/domain/types/result";
import type { ContainerError } from "@/domain/ports/platform-container-port.interface";

/**
 * Framework-local helper to defensively extract a boolean from container.isRegistered().
 *
 * Framework-Core must not depend on Infrastructure runtime-safe-cast utilities.
 */
export function getRegistrationStatus(result: Result<boolean, ContainerError>): boolean {
  return result.ok ? result.value : false;
}

import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { DomainSettingsError } from "@/domain/types/settings";

/**
 * Context information for error mapping operations.
 */
export interface ErrorMappingContext {
  /** The operation that was being performed when the error occurred */
  operation: "register" | "get" | "set";
  /** The namespace of the setting */
  namespace: string;
  /** The key of the setting */
  key: string;
}

/**
 * Interface for mapping Foundry-specific errors to platform-agnostic SettingsError.
 *
 * Enables Open/Closed Principle: New Foundry error codes can be handled by
 * implementing this interface without modifying existing code.
 *
 * @example
 * ```typescript
 * const mapper: SettingsErrorMapper = new FoundrySettingsErrorMapper();
 * const settingsError = mapper.map(foundryError, {
 *   operation: "register",
 *   namespace: "my-module",
 *   key: "enabled"
 * });
 * ```
 */
export interface SettingsErrorMapper {
  /**
   * Maps a FoundryError to a platform-agnostic SettingsError.
   *
   * @param error - The Foundry-specific error to map
   * @param context - Context information about the operation and setting
   * @returns Platform-agnostic SettingsError
   */
  map(error: FoundryError, context: ErrorMappingContext): DomainSettingsError;
}

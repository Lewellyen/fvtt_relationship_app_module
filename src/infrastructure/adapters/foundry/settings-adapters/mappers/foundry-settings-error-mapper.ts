import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { DomainSettingsError } from "@/domain/types/settings";
import type { SettingsErrorMapper, ErrorMappingContext } from "./settings-error-mapper.interface";

/**
 * Default implementation of SettingsErrorMapper for Foundry VTT.
 *
 * Maps Foundry-specific error codes to platform-agnostic SettingsError codes.
 *
 * DESIGN: This is a separate class to follow Open/Closed Principle.
 * New Foundry error codes can be handled by creating a new mapper implementation
 * or extending this one, without modifying FoundrySettingsAdapter.
 */
export class FoundrySettingsErrorMapper implements SettingsErrorMapper {
  /**
   * Maps a FoundryError to a platform-agnostic SettingsError.
   *
   * @param foundryError - The Foundry-specific error to map
   * @param context - Context information about the operation and setting
   * @returns Platform-agnostic SettingsError
   */
  map(foundryError: FoundryError, context: ErrorMappingContext): DomainSettingsError {
    // Map Foundry error codes to DomainSettingsError codes
    let code: DomainSettingsError["code"];
    switch (foundryError.code) {
      case "API_NOT_AVAILABLE":
        code = "PLATFORM_NOT_AVAILABLE";
        break;
      case "VALIDATION_FAILED":
        code = "INVALID_SETTING_VALUE";
        break;
      case "OPERATION_FAILED":
        // Check if it's a registration failure
        if (context.operation === "register") {
          code = "SETTING_REGISTRATION_FAILED";
        } else {
          // For get/set operations, check the error message
          const message = foundryError.message.toLowerCase();
          if (message.includes("not registered") || message.includes("not found")) {
            code = "SETTING_NOT_FOUND";
          } else if (context.operation === "get") {
            code = "SETTING_READ_FAILED";
          } else {
            code = "SETTING_WRITE_FAILED";
          }
        }
        break;
      default:
        // Default based on operation type
        if (context.operation === "register") {
          code = "SETTING_REGISTRATION_FAILED";
        } else if (context.operation === "get") {
          code = "SETTING_READ_FAILED";
        } else {
          code = "SETTING_WRITE_FAILED";
        }
    }

    return {
      code,
      message: `Failed to ${context.operation} setting "${context.namespace}.${context.key}": ${foundryError.message}`,
      details: foundryError,
    };
  }
}

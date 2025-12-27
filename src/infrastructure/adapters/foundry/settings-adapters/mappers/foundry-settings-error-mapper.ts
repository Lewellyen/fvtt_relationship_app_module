import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { SettingsError } from "@/domain/ports/platform-settings-port.interface";
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
  map(foundryError: FoundryError, context: ErrorMappingContext): SettingsError {
    // Map Foundry error codes to Settings error codes
    let code: SettingsError["code"];
    switch (foundryError.code) {
      case "API_NOT_AVAILABLE":
        code = "PLATFORM_NOT_AVAILABLE";
        break;
      case "VALIDATION_FAILED":
        code = "SETTING_VALIDATION_FAILED";
        break;
      case "OPERATION_FAILED":
        // Check if it's a registration failure
        if (context.operation === "register") {
          code = "SETTING_REGISTRATION_FAILED";
        } else {
          // For get/set, could be unregistered setting or other issue
          // Check error message for hints
          const message = foundryError.message.toLowerCase();
          if (message.includes("not registered") || message.includes("not found")) {
            code = "SETTING_NOT_REGISTERED";
          } else {
            code = "SETTING_VALIDATION_FAILED";
          }
        }
        break;
      default:
        // Default to registration failed for register, validation failed for get/set
        code =
          context.operation === "register"
            ? "SETTING_REGISTRATION_FAILED"
            : "SETTING_VALIDATION_FAILED";
    }

    return {
      code,
      message: `Failed to ${context.operation} setting "${context.namespace}.${context.key}": ${foundryError.message}`,
      details: foundryError,
    };
  }
}

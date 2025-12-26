/**
 * Platform-agnostic error for settings operations.
 *
 * Used by both PlatformSettingsPort and ValidationSchema interfaces.
 * Extracted to a separate file to avoid circular dependencies.
 */
export interface SettingsError {
  code:
    | "SETTING_NOT_REGISTERED" // Trying to get/set unregistered setting
    | "SETTING_VALIDATION_FAILED" // Setting value failed validation
    | "SETTING_REGISTRATION_FAILED" // Platform rejected registration
    | "PLATFORM_NOT_AVAILABLE"; // Platform not initialized yet
  message: string;
  details?: unknown;
}

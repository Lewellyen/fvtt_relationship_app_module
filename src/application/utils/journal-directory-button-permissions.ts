import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { SETTING_KEYS } from "@/application/constants/app-constants";
import { MODULE_METADATA } from "@/application/constants/app-constants";

/**
 * Type guard for boolean values.
 * Used to validate setting values are boolean type.
 *
 * @param value - Value to check
 * @returns true if value is boolean, false otherwise
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Checks if the current user has permission to see journal directory buttons
 * based on their role and the configured settings.
 *
 * @param settings - Settings port for reading permission settings
 * @param user - Foundry user object (game.user)
 * @returns true if user should see buttons, false otherwise
 */
export function canUserSeeJournalDirectoryButtons(
  settings: PlatformSettingsRegistrationPort,
  user: { role?: number } | undefined
): boolean {
  // Guard: user must be defined
  if (!user || user.role === undefined) {
    // Fallback to default: only GM can see buttons
    return false;
  }

  // Map user role to setting key
  // Foundry VTT role values: PLAYER=1, TRUSTED=2, ASSISTANT=3, GAMEMASTER=4
  // We use numeric values directly to avoid dependency on CONST.USER_ROLES
  let settingKey: string;
  if (user.role === 1) {
    // CONST.USER_ROLES.PLAYER
    settingKey = SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_PLAYER;
  } else if (user.role === 2) {
    // CONST.USER_ROLES.TRUSTED
    settingKey = SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_TRUSTED;
  } else if (user.role === 3) {
    // CONST.USER_ROLES.ASSISTANT
    settingKey = SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_ASSISTANT;
  } else if (user.role === 4) {
    // CONST.USER_ROLES.GAMEMASTER
    settingKey = SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_GAMEMASTER;
  } else {
    // Unknown role - fallback to default: only GM can see buttons
    return false;
  }

  // Read setting value
  const settingResult = settings.getSettingValue(MODULE_METADATA.ID, settingKey, isBoolean);

  // If setting read failed, fallback to default (only GM)
  if (!settingResult.ok) {
    return false;
  }

  return settingResult.value;
}

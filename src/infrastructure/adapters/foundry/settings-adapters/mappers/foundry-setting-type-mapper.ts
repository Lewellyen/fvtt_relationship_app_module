import type { Result } from "@/domain/types/result";
import type { SettingType } from "@/domain/ports/platform-settings-port.interface";
import type { DomainSettingsError } from "@/domain/types/settings";
import type { SettingTypeMapper } from "./setting-type-mapper.interface";

/**
 * Default implementation of SettingTypeMapper for Foundry VTT.
 *
 * Maps platform-agnostic setting types to Foundry's type constructors.
 * Supports both constructor types (typeof String) and string types ("String").
 *
 * DESIGN: This is a separate class to follow Open/Closed Principle.
 * New setting types can be added by creating a new mapper implementation
 * or extending this one, without modifying FoundrySettingsAdapter.
 */
export class FoundrySettingTypeMapper implements SettingTypeMapper {
  /**
   * Maps a platform-agnostic SettingType to Foundry-specific type constructor.
   *
   * @param type - The setting type to map
   * @returns Result containing the Foundry type constructor or a SettingsError
   */
  map(
    type: SettingType
  ): Result<typeof String | typeof Number | typeof Boolean, DomainSettingsError> {
    if (type === "String" || type === String) {
      return { ok: true, value: String };
    }
    if (type === "Number" || type === Number) {
      return { ok: true, value: Number };
    }
    if (type === "Boolean" || type === Boolean) {
      return { ok: true, value: Boolean };
    }
    return {
      ok: false,
      error: {
        code: "SETTING_REGISTRATION_FAILED",
        message: `Unknown setting type: ${type}. Supported types are: String, Number, Boolean`,
        details: { type },
      },
    };
  }
}

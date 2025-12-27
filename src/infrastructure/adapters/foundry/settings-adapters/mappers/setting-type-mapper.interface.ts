import type { Result } from "@/domain/types/result";
import type { SettingType, SettingsError } from "@/domain/ports/platform-settings-port.interface";

/**
 * Interface for mapping platform-agnostic SettingType to Foundry-specific type constructors.
 *
 * Enables Open/Closed Principle: New setting types can be added by implementing
 * this interface without modifying existing code.
 *
 * @example
 * ```typescript
 * const mapper: SettingTypeMapper = new FoundrySettingTypeMapper();
 * const result = mapper.map(String);
 * if (result.ok) {
 *   // result.value is typeof String (Foundry constructor)
 * }
 * ```
 */
export interface SettingTypeMapper {
  /**
   * Maps a platform-agnostic SettingType to Foundry-specific type constructor.
   *
   * @param type - The setting type to map (String, Number, Boolean or their string equivalents)
   * @returns Result containing the Foundry type constructor or a SettingsError
   */
  map(type: SettingType): Result<typeof String | typeof Number | typeof Boolean, SettingsError>;
}

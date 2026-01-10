import { SETTING_KEYS } from "@/application/constants/app-constants";
import type { SettingDefinition } from "./setting-definition.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Foundry setting that controls whether Players can see journal directory buttons.
 */
export const journalDirectoryButtonsPlayerSetting: SettingDefinition<boolean> = {
  key: SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_PLAYER,

  createConfig(i18n, _logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(i18n.translate("USER.RolePlayer", "Player"), "Player"),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.journalDirectoryButtonsPlayer.hint",
          "Allow Players to see the journal directory buttons (Show All Hidden Journals and Overview)."
        ),
        "Allow Players to see the journal directory buttons (Show All Hidden Journals and Overview)."
      ),
      scope: "world",
      config: true,
      type: "boolean",
      default: false,
    };
  },
};

/**
 * Foundry setting that controls whether Trusted Players can see journal directory buttons.
 */
export const journalDirectoryButtonsTrustedSetting: SettingDefinition<boolean> = {
  key: SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_TRUSTED,

  createConfig(i18n, _logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(i18n.translate("USER.RoleTrustedPlayer", "Trusted Player"), "Trusted Player"),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.journalDirectoryButtonsTrusted.hint",
          "Allow Trusted Players to see the journal directory buttons (Show All Hidden Journals and Overview)."
        ),
        "Allow Trusted Players to see the journal directory buttons (Show All Hidden Journals and Overview)."
      ),
      scope: "world",
      config: true,
      type: "boolean",
      default: false,
    };
  },
};

/**
 * Foundry setting that controls whether Assistant GMs can see journal directory buttons.
 */
export const journalDirectoryButtonsAssistantSetting: SettingDefinition<boolean> = {
  key: SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_ASSISTANT,

  createConfig(i18n, _logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(
        i18n.translate("USER.RoleAssistantGM", "Assistant Game Master"),
        "Assistant Game Master"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.journalDirectoryButtonsAssistant.hint",
          "Allow Assistant Game Masters to see the journal directory buttons (Show All Hidden Journals and Overview)."
        ),
        "Allow Assistant Game Masters to see the journal directory buttons (Show All Hidden Journals and Overview)."
      ),
      scope: "world",
      config: true,
      type: "boolean",
      default: false,
    };
  },
};

/**
 * Foundry setting that controls whether Game Masters can see journal directory buttons.
 */
export const journalDirectoryButtonsGamemasterSetting: SettingDefinition<boolean> = {
  key: SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_GAMEMASTER,

  createConfig(i18n, _logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(i18n.translate("USER.RoleGamemaster", "Game Master"), "Game Master"),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.journalDirectoryButtonsGamemaster.hint",
          "Allow Game Masters to see the journal directory buttons (Show All Hidden Journals and Overview)."
        ),
        "Allow Game Masters to see the journal directory buttons (Show All Hidden Journals and Overview)."
      ),
      scope: "world",
      config: true,
      type: "boolean",
      default: true,
    };
  },
};

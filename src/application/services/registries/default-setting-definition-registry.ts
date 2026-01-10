/**
 * Default implementation of SettingDefinitionRegistry.
 *
 * Provides all module setting definitions for registration.
 * This is the migration path from the hardcoded list in ModuleSettingsRegistrar.
 */

import type { SettingDefinitionRegistry } from "./setting-definition-registry.interface";
import type { SettingDefinition } from "@/application/settings/setting-definition.interface";
import { castSettingDefinitionToUnknown } from "@/application/utils/registry-casts";
import { logLevelSetting } from "@/application/settings/log-level-setting";
import { cacheEnabledSetting } from "@/application/settings/cache-enabled-setting";
import { cacheDefaultTtlSetting } from "@/application/settings/cache-default-ttl-setting";
import { cacheMaxEntriesSetting } from "@/application/settings/cache-max-entries-setting";
import { performanceTrackingSetting } from "@/application/settings/performance-tracking-setting";
import { performanceSamplingSetting } from "@/application/settings/performance-sampling-setting";
import { metricsPersistenceEnabledSetting } from "@/application/settings/metrics-persistence-enabled-setting";
import { metricsPersistenceKeySetting } from "@/application/settings/metrics-persistence-key-setting";
import { notificationQueueMaxSizeSetting } from "@/application/settings/notification-queue-max-size-setting";
import { journalDirectoryButtonsPlayerSetting } from "@/application/settings/journal-directory-buttons-permissions-setting";
import { journalDirectoryButtonsTrustedSetting } from "@/application/settings/journal-directory-buttons-permissions-setting";
import { journalDirectoryButtonsAssistantSetting } from "@/application/settings/journal-directory-buttons-permissions-setting";
import { journalDirectoryButtonsGamemasterSetting } from "@/application/settings/journal-directory-buttons-permissions-setting";

/**
 * Default registry containing all module setting definitions.
 *
 * Implements Open/Closed Principle: New settings can be added to this array
 * without modifying ModuleSettingsRegistrar.
 */
export class DefaultSettingDefinitionRegistry implements SettingDefinitionRegistry {
  getAll(): readonly SettingDefinition<unknown>[] {
    return [
      castSettingDefinitionToUnknown(logLevelSetting),
      castSettingDefinitionToUnknown(cacheEnabledSetting),
      castSettingDefinitionToUnknown(cacheDefaultTtlSetting),
      castSettingDefinitionToUnknown(cacheMaxEntriesSetting),
      castSettingDefinitionToUnknown(performanceTrackingSetting),
      castSettingDefinitionToUnknown(performanceSamplingSetting),
      castSettingDefinitionToUnknown(metricsPersistenceEnabledSetting),
      castSettingDefinitionToUnknown(metricsPersistenceKeySetting),
      castSettingDefinitionToUnknown(notificationQueueMaxSizeSetting),
      castSettingDefinitionToUnknown(journalDirectoryButtonsPlayerSetting),
      castSettingDefinitionToUnknown(journalDirectoryButtonsTrustedSetting),
      castSettingDefinitionToUnknown(journalDirectoryButtonsAssistantSetting),
      castSettingDefinitionToUnknown(journalDirectoryButtonsGamemasterSetting),
    ];
  }
}

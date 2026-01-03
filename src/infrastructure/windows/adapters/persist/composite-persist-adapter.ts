import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { PersistConfig, PersistMeta } from "@/domain/windows/types/persist-config.interface";
import type { PersistError } from "@/domain/windows/types/errors/persist-error.interface";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import { platformSettingsPortToken } from "@/application/tokens/domain-ports.tokens";
import { FlagsPersistAdapter } from "./flags-persist-adapter";
import { SettingsPersistAdapter } from "./settings-persist-adapter";

/**
 * CompositePersistAdapter - Kombiniert mehrere PersistAdapter basierend auf Config-Type
 *
 * Phase 2: Unterstützt Flags und Settings
 */
export class CompositePersistAdapter implements IPersistAdapter {
  static dependencies = [platformSettingsPortToken] as const;

  private readonly flagsAdapter: FlagsPersistAdapter;
  private readonly settingsAdapter: SettingsPersistAdapter;

  constructor(settingsPort: PlatformSettingsPort) {
    this.flagsAdapter = new FlagsPersistAdapter();
    this.settingsAdapter = new SettingsPersistAdapter(settingsPort);
  }

  async save(
    config: PersistConfig,
    data: Record<string, unknown>,
    meta?: PersistMeta
  ): Promise<import("@/domain/types/result").Result<void, PersistError>> {
    const adapter = this.getAdapter(config.type);
    return adapter.save(config, data, meta);
  }

  async load(
    config: PersistConfig
  ): Promise<import("@/domain/types/result").Result<Record<string, unknown>, PersistError>> {
    const adapter = this.getAdapter(config.type);
    return adapter.load(config);
  }

  private getAdapter(type: PersistConfig["type"]): IPersistAdapter {
    switch (type) {
      case "flag":
        return this.flagsAdapter;
      case "setting":
        return this.settingsAdapter;
      default:
        // Fallback zu FlagsAdapter für unbekannte Typen
        return this.flagsAdapter;
    }
  }
}

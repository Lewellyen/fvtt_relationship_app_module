import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { PersistConfig, PersistMeta } from "@/domain/windows/types/persist-config.interface";
import type { PersistError } from "@/domain/windows/types/errors/persist-error.interface";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { ValidationSchema } from "@/domain/types/validation-schema.interface";
import type { SettingsError } from "@/domain/types/settings-error";
import { ok, err } from "@/domain/utils/result";
import { isRecord } from "@/infrastructure/adapters/foundry/runtime-casts";

/**
 * ValidationSchema für Record<string, unknown> - akzeptiert jedes Objekt
 */
const recordSchema: ValidationSchema<Record<string, unknown>> = {
  validate(
    value: unknown
  ): import("@/domain/types/result").Result<Record<string, unknown>, SettingsError> {
    if (isRecord(value)) {
      return ok(value);
    }
    return err({
      code: "SETTING_VALIDATION_FAILED",
      message: "Value is not a valid object",
    });
  },
};

/**
 * SettingsPersistAdapter - IPersistAdapter für Settings (MVP: Basis)
 */
export class SettingsPersistAdapter implements IPersistAdapter {
  constructor(private readonly settingsPort: PlatformSettingsPort) {}
  async save(
    config: PersistConfig,
    data: Record<string, unknown>,
    _meta?: PersistMeta
  ): Promise<import("@/domain/types/result").Result<void, PersistError>> {
    if (config.type !== "setting") {
      return err({ code: "InvalidType", message: "Not a setting persist config" });
    }

    if (!config.namespace || !config.key) {
      return err({
        code: "InvalidConfig",
        message: "Setting config requires namespace and key",
      });
    }

    const result = await this.settingsPort.set(config.namespace, config.key, data);
    if (!result.ok) {
      return err({
        code: "SaveFailed",
        message: result.error.message,
        cause: result.error,
      });
    }
    return ok(undefined);
  }

  async load(
    config: PersistConfig
  ): Promise<import("@/domain/types/result").Result<Record<string, unknown>, PersistError>> {
    if (config.type !== "setting") {
      return err({ code: "InvalidType", message: "Not a setting persist config" });
    }

    if (!config.namespace || !config.key) {
      return err({
        code: "InvalidConfig",
        message: "Setting config requires namespace and key",
      });
    }

    const result = this.settingsPort.get(config.namespace, config.key, recordSchema);
    if (!result.ok) {
      return err({
        code: "LoadFailed",
        message: result.error.message,
        cause: result.error,
      });
    }
    return ok(result.value || {});
  }
}

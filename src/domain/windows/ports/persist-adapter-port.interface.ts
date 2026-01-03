import type { Result } from "@/domain/types/result";
import type { PersistError } from "../types/errors/persist-error.interface";
import type { PersistConfig, PersistMeta } from "../types/persist-config.interface";

/**
 * IPersistAdapter - Abstraktion für Persistenz-Operationen
 */
export interface IPersistAdapter {
  /**
   * Speichert Daten gemäß PersistConfig.
   *
   * @param config - PersistConfig
   * @param data - Zu speichernde Daten
   * @param meta - Optional: PersistMeta für Origin-Tracking
   * @returns Result
   */
  save(
    config: PersistConfig,
    data: Record<string, unknown>,
    meta?: PersistMeta
  ): Promise<Result<void, PersistError>>;

  /**
   * Lädt Daten gemäß PersistConfig.
   *
   * @param config - PersistConfig
   * @returns Result mit geladenen Daten oder Fehler
   */
  load(config: PersistConfig): Promise<Result<Record<string, unknown>, PersistError>>;
}

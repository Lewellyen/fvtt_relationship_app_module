import type { Result } from "@/domain/types/result";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import type { PersistConfig, PersistMeta } from "@/domain/windows/types/persist-config.interface";

/**
 * IWindowPersistenceCoordinator - Port für Persistenz-Koordination
 *
 * Verantwortlichkeit: Isoliert Persist/Restore-Logik.
 */
export interface IWindowPersistenceCoordinator {
  /**
   * Speichert State gemäß PersistConfig.
   *
   * @param config - PersistConfig
   * @param state - Zu speichernder State
   * @param meta - Optional: PersistMeta für Origin-Tracking
   * @returns Result
   */
  persist(
    config: PersistConfig,
    state: Record<string, unknown>,
    meta?: PersistMeta
  ): Promise<Result<void, WindowError>>;

  /**
   * Lädt State gemäß PersistConfig.
   *
   * @param config - PersistConfig
   * @returns Result mit geladenem State oder Fehler
   */
  restore(config: PersistConfig): Promise<Result<Record<string, unknown>, WindowError>>;
}

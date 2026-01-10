import type { IWindowPersistenceCoordinator } from "../ports/window-persistence-coordinator-port.interface";
import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { Result } from "@/domain/types/result";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import type { PersistConfig, PersistMeta } from "@/domain/windows/types/persist-config.interface";
import { err } from "@/domain/utils/result";
import { persistAdapterToken } from "../tokens/window.tokens";

/**
 * WindowPersistenceCoordinator - Koordiniert Persistenz-Operationen
 *
 * Verantwortlichkeit: Isoliert Persist/Restore-Logik.
 * Delegiert an IPersistAdapter für konkrete Persistenz-Operationen.
 */
export class WindowPersistenceCoordinator implements IWindowPersistenceCoordinator {
  static dependencies = [persistAdapterToken] as const;

  constructor(private readonly persistAdapter: IPersistAdapter | undefined) {}

  async persist(
    config: PersistConfig,
    state: Record<string, unknown>,
    meta?: PersistMeta
  ): Promise<Result<void, WindowError>> {
    if (!this.persistAdapter) {
      return err({
        code: "NoPersistAdapter",
        message: "No persist adapter available",
      });
    }

    const result = await this.persistAdapter.save(config, state, meta);
    if (!result.ok) {
      return err({
        code: "PersistFailed",
        message: `Failed to persist state: ${result.error.message}`,
      });
    }

    return result;
  }

  async restore(config: PersistConfig): Promise<Result<Record<string, unknown>, WindowError>> {
    if (!this.persistAdapter) {
      return err({
        code: "NoPersistAdapter",
        message: "No persist adapter available",
      });
    }

    const result = await this.persistAdapter.load(config);
    if (!result.ok) {
      return err({
        code: "RestoreFailed",
        message: `Failed to restore state: ${result.error.message}`,
      });
    }

    return result;
  }
}

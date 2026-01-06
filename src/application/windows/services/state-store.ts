import type { IStateStore } from "@/domain/windows/ports/state-store-port.interface";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import { ok, err } from "@/domain/utils/result";
import { getMapValueOrCreate } from "../utils/window-state-casts";

/**
 * StateStore - Basis StateStore (in-memory)
 *
 * Verwaltet State pro Window-Instance in einer einfachen Map-basierten Struktur.
 */
export class StateStore implements IStateStore {
  private readonly state = new Map<string, Map<string, unknown>>();

  set(
    instanceId: string,
    key: string,
    value: unknown
  ): import("@/domain/types/result").Result<void, WindowError> {
    const instanceState = getMapValueOrCreate(
      this.state,
      instanceId,
      () => new Map<string, unknown>()
    );
    instanceState.set(key, value);

    return ok(undefined);
  }

  get(
    instanceId: string,
    key: string
  ): import("@/domain/types/result").Result<unknown, WindowError> {
    const instanceState = this.state.get(instanceId);
    if (!instanceState) {
      return err({
        code: "InstanceNotFound",
        message: `Instance ${instanceId} not found`,
      });
    }

    if (!instanceState.has(key)) {
      return err({
        code: "KeyNotFound",
        message: `Key ${key} not found for instance ${instanceId}`,
      });
    }

    return ok(instanceState.get(key));
  }

  getAll(
    instanceId: string
  ): import("@/domain/types/result").Result<Record<string, unknown>, WindowError> {
    const instanceState = this.state.get(instanceId);
    if (!instanceState) {
      return ok({});
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of instanceState.entries()) {
      result[key] = value;
    }

    return ok(result);
  }

  clear(instanceId: string): import("@/domain/types/result").Result<void, WindowError> {
    this.state.delete(instanceId);
    return ok(undefined);
  }
}

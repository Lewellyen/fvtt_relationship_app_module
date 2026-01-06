import type { IBindingEngine } from "@/domain/windows/ports/binding-engine-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { NormalizedBinding } from "@/domain/windows/types/binding-descriptor.interface";
import type { BindingSource } from "@/domain/windows/types/binding-descriptor.interface";
import type { PersistConfig } from "@/domain/windows/types/persist-config.interface";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import type { IStateStore } from "@/domain/windows/ports/state-store-port.interface";
import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import { ok, err } from "@/domain/utils/result";
import { stateStoreToken, persistAdapterToken, remoteSyncGateToken } from "../tokens/window.tokens";
import {
  getMapValueOrCreate,
  getNestedValue,
  createNestedObject,
} from "../utils/window-state-casts";
import { isRecord } from "@/domain/utils/type-guards";

/**
 * BindingEngine - Normalisiert Bindings (Control-local → global), verwaltet Bindings
 *
 * Phase 2: Vollständige Settings/Flags-Unterstützung, Debounce-Logik
 */
export class BindingEngine implements IBindingEngine {
  static dependencies = [stateStoreToken, persistAdapterToken, remoteSyncGateToken] as const;

  private readonly bindings = new Map<string, Map<string, NormalizedBinding>>();
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly stateStore: IStateStore,
    private readonly persistAdapter?: IPersistAdapter,
    private readonly remoteSyncGate?: IRemoteSyncGate
  ) {}

  initialize(
    definition: WindowDefinition,
    instanceId: string
  ): import("@/domain/types/result").Result<void, WindowError> {
    const normalized = this.getNormalizedBindings(definition);

    const instanceBindings = getMapValueOrCreate(
      this.bindings,
      instanceId,
      () => new Map<string, NormalizedBinding>()
    );

    for (const binding of normalized) {
      instanceBindings.set(binding.id || `${binding.source.key}-binding`, binding);

      // Initial-Wert laden (async for PersistAdapter)
      this.loadBindingValue(binding.source, instanceId).then((valueResult) => {
        if (valueResult.ok && valueResult.value !== undefined) {
          // State setzen (über stateKey)
          this.stateStore.set(instanceId, binding.target.stateKey, valueResult.value);
        }
      });
    }

    return ok(undefined);
  }

  async sync(
    instanceId: string,
    policy: "none" | "debounced" | "immediate" = "immediate"
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    if (policy === "none") return ok(undefined);

    const instanceBindings = this.bindings.get(instanceId);
    if (!instanceBindings) return ok(undefined);

    for (const binding of instanceBindings.values()) {
      // Prüfe Binding-spezifische Policy
      // Map "manual" to "none" for compatibility
      const bindingSyncPolicy = binding.syncPolicy === "manual" ? "none" : binding.syncPolicy;
      const bindingPolicy: "none" | "debounced" | "immediate" = (bindingSyncPolicy ?? policy) as
        | "none"
        | "debounced"
        | "immediate";
      if (bindingPolicy === "none") continue;

      if (binding.twoWay) {
        const stateResult = this.stateStore.get(instanceId, binding.target.stateKey);
        if (!stateResult.ok) continue;

        if (bindingPolicy === "debounced") {
          // Phase 2: Debounce-Logik
          this.scheduleDebouncedSync(
            binding.id || `${binding.source.key}-binding`,
            instanceId,
            binding.source,
            stateResult.value
          );
        } else {
          // Immediate sync
          const saveResult = await this.saveBindingValue(
            binding.source,
            instanceId,
            stateResult.value
          );
          if (!saveResult.ok) return err(saveResult.error);
        }
      }
    }

    return ok(undefined);
  }

  /**
   * Phase 2: Schedules a debounced sync for a binding
   */
  private scheduleDebouncedSync(
    bindingId: string,
    instanceId: string,
    source: BindingSource,
    value: unknown
  ): void {
    const timerKey = `${instanceId}:${bindingId}`;

    // Clear existing timer if any
    const existingTimer = this.debounceTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Find binding to get debounceMs
    const instanceBindings = this.bindings.get(instanceId);
    const binding = instanceBindings?.get(bindingId);
    const debounceMs = binding?.debounceMs ?? 300; // Default: 300ms

    // Schedule new sync
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(timerKey);
      const saveResult = await this.saveBindingValue(source, instanceId, value);
      if (!saveResult.ok) {
        console.error(`Failed to save debounced binding ${bindingId}:`, saveResult.error);
      }
    }, debounceMs);

    this.debounceTimers.set(timerKey, timer);
  }

  getNormalizedBindings(definition: WindowDefinition): ReadonlyArray<NormalizedBinding> {
    const normalized: NormalizedBinding[] = [];

    // 1. Lokale Bindings aus Controls normalisieren
    for (const control of definition.controls || []) {
      if (control.binding) {
        normalized.push({
          ...control.binding,
          id: control.binding.id || `${control.id}-binding`,
          isLocal: true,
        });
      }
    }

    // 2. Globale Bindings hinzufügen
    for (const binding of definition.bindings || []) {
      normalized.push({
        ...binding,
        isLocal: false,
      });
    }

    return normalized;
  }

  /**
   * Phase 2: Loads a binding value from the source
   */
  private async loadBindingValue(
    source: BindingSource,
    instanceId: string
  ): Promise<import("@/domain/types/result").Result<unknown, WindowError>> {
    switch (source.type) {
      case "state":
        return this.stateStore.get(instanceId, source.key);

      case "setting":
      case "flag":
        // Phase 2: Via PersistAdapter
        if (!this.persistAdapter) {
          return ok(undefined);
        }

        const persistConfig = this.bindingSourceToPersistConfig(source);
        if (!persistConfig.ok) {
          return err(persistConfig.error);
        }

        const loadResult = await this.persistAdapter.load(persistConfig.value);
        if (!loadResult.ok) {
          return err({
            code: "BindingLoadFailed",
            message: `Failed to load ${source.type} binding: ${loadResult.error.message}`,
          });
        }

        // Extract nested value if key is a path (e.g., "some.nested.key")
        const data = loadResult.value;
        if (source.key.includes(".")) {
          const nestedValue = getNestedValue(data, source.key);
          return ok(nestedValue);
        }

        if (isRecord(data)) {
          return ok(data[source.key] ?? data);
        }
        return ok(data);

      case "journal":
        // Phase 2: Journal not yet implemented
        return ok(undefined);

      default:
        return ok(undefined);
    }
  }

  /**
   * Phase 2: Saves a binding value to the source
   */
  private async saveBindingValue(
    source: BindingSource,
    instanceId: string,
    value: unknown
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    switch (source.type) {
      case "state":
        // State bindings are handled via StateStore directly
        this.stateStore.set(instanceId, source.key, value);
        return ok(undefined);

      case "setting":
      case "flag":
        // Phase 2: Via PersistAdapter
        if (!this.persistAdapter) {
          return ok(undefined);
        }

        const persistConfig = this.bindingSourceToPersistConfig(source);
        if (!persistConfig.ok) {
          return err(persistConfig.error);
        }

        // Prepare data: if key is nested, create nested structure
        const data = createNestedObject(source.key, value);

        // Create PersistMeta for origin tracking
        const meta = this.remoteSyncGate?.makePersistMeta(instanceId);

        const saveResult = await this.persistAdapter.save(persistConfig.value, data, meta);
        if (!saveResult.ok) {
          return err({
            code: "BindingSaveFailed",
            message: `Failed to save ${source.type} binding: ${saveResult.error.message}`,
          });
        }

        return ok(undefined);

      case "journal":
        // Phase 2: Journal not yet implemented
        return ok(undefined);

      default:
        return ok(undefined);
    }
  }

  /**
   * Phase 2: Converts BindingSource to PersistConfig
   */
  private bindingSourceToPersistConfig(
    source: BindingSource
  ): import("@/domain/types/result").Result<PersistConfig, WindowError> {
    if (source.type === "setting") {
      if (!source.namespace) {
        return err({
          code: "InvalidBindingSource",
          message: "Setting binding requires namespace",
        });
      }
      return ok({
        type: "setting",
        key: source.key,
        namespace: source.namespace,
      });
    }

    if (source.type === "flag") {
      if (!source.namespace || !source.documentId) {
        return err({
          code: "InvalidBindingSource",
          message: "Flag binding requires namespace and documentId",
        });
      }
      return ok({
        type: "flag",
        key: source.key,
        namespace: source.namespace,
        documentId: source.documentId,
      });
    }

    return err({
      code: "InvalidBindingSource",
      message: `Cannot convert ${source.type} to PersistConfig`,
    });
  }
}

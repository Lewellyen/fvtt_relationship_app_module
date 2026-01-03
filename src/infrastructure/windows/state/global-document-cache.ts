import type {
  ISharedDocumentCache,
  ActorSnapshot,
  ItemSnapshot,
} from "@/application/windows/ports/shared-document-cache-port.interface";
import { castSvelteStateRune } from "@/infrastructure/adapters/foundry/runtime-casts";

/**
 * GlobalDocumentCache - Singleton-Cache für Shared Document State
 *
 * Reference Implementation mit RuneState für Svelte (kann reaktiv sein).
 *
 * WICHTIG:
 * - `GlobalDocumentCache` ist eine **Infrastructure-Implementierung** von `ISharedDocumentCache`.
 * - Core (HookBridge, Controller) spricht nur mit dem **Port** (`ISharedDocumentCache`), nicht mit RuneState direkt.
 * - `GlobalDocumentCache` ist ein **Mirror**, kein Authority Store.
 * - Writes erfolgen ausschließlich über Services + PersistAdapter.
 * - Foundry DB bleibt die letzte Instanz (Source of Truth).
 * - **GlobalDocumentCache darf niemals Actions auslösen** - er ist rein passiv (Hook → Patch → UI).
 */
export class GlobalDocumentCache implements ISharedDocumentCache {
  private static instance: GlobalDocumentCache | null = null;

  // Reaktive Caches (Plain Objects, nicht Foundry Document Instanzen)
  // Serialisierte Snapshots (system/flags/name etc.) als Plain Objects
  // Fallback für Tests: Wenn $state nicht verfügbar ist, verwende normale Map

  readonly actorsById: Map<string, ActorSnapshot> = (() => {
    // Type-safe cast: Use runtime cast helper for Svelte 5 $state rune
    const $stateResult = castSvelteStateRune();
    if ($stateResult.ok) {
      return $stateResult.value(new Map<string, ActorSnapshot>());
    }
    // Fallback for tests: If $state is not available, use normal Map
    return new Map<string, ActorSnapshot>();
  })();

  readonly itemsById: Map<string, ItemSnapshot> = (() => {
    // Type-safe cast: Use runtime cast helper for Svelte 5 $state rune
    const $stateResult = castSvelteStateRune();
    if ($stateResult.ok) {
      return $stateResult.value(new Map<string, ItemSnapshot>());
    }
    // Fallback for tests: If $state is not available, use normal Map
    return new Map<string, ItemSnapshot>();
  })();

  readonly itemsByActorId: Map<string, string[]> = (() => {
    // Type-safe cast: Use runtime cast helper for Svelte 5 $state rune
    const $stateResult = castSvelteStateRune();
    if ($stateResult.ok) {
      return $stateResult.value(new Map<string, string[]>());
    }
    // Fallback for tests: If $state is not available, use normal Map
    return new Map<string, string[]>();
  })();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): GlobalDocumentCache {
    if (!GlobalDocumentCache.instance) {
      GlobalDocumentCache.instance = new GlobalDocumentCache();
    }
    return GlobalDocumentCache.instance;
  }

  // Idempotent Patch: nur ändern wenn value differs
  patchActor(actorId: string, updates: Partial<ActorSnapshot>): void {
    const actor = this.actorsById.get(actorId);
    if (!actor) {
      // Neuen Snapshot erstellen
      // type-coverage:ignore-next-line
      this.actorsById.set(actorId, { ...updates, id: actorId } as ActorSnapshot);
      return;
    }

    // Nur ändern wenn value differs (verhindert unnötige Reaktionen)
    let hasChanges = false;
    for (const [key, value] of Object.entries(updates)) {
      // type-coverage:ignore-next-line
      const typedKey = key as keyof ActorSnapshot;
      if (actor[typedKey] !== value) {
        // type-coverage:ignore-next-line
        (actor as unknown as Record<string, unknown>)[key] = value;
        hasChanges = true;
      }
    }

    // WICHTIG: Map-Mutation explizit triggern (für Svelte-Reaktivität)
    // Immer set() aufrufen, nie nur interne Objektfelder ändern!
    if (hasChanges) {
      this.actorsById.set(actorId, actor); // Re-trigger Reaktivität
    }
  }

  patchItem(itemId: string, updates: Partial<ItemSnapshot>): void {
    const item = this.itemsById.get(itemId);
    if (!item) {
      // Neuen Snapshot erstellen
      // type-coverage:ignore-next-line
      this.itemsById.set(itemId, { ...updates, id: itemId } as ItemSnapshot);

      // Update itemsByActorId if actorId is provided
      if (updates.actorId) {
        const actorItems = this.itemsByActorId.get(updates.actorId) || [];
        if (!actorItems.includes(itemId)) {
          this.itemsByActorId.set(updates.actorId, [...actorItems, itemId]);
        }
      }
      return;
    }

    const oldActorId = item.actorId;

    // Nur ändern wenn value differs (verhindert unnötige Reaktionen)
    let hasChanges = false;
    for (const [key, value] of Object.entries(updates)) {
      // type-coverage:ignore-next-line
      const typedKey = key as keyof ItemSnapshot;
      if (item[typedKey] !== value) {
        // type-coverage:ignore-next-line
        (item as unknown as Record<string, unknown>)[key] = value;
        hasChanges = true;
      }
    }

    // Update itemsByActorId if actorId changed
    if (updates.actorId && updates.actorId !== oldActorId) {
      if (oldActorId) {
        const oldActorItems = this.itemsByActorId.get(oldActorId) || [];
        this.itemsByActorId.set(
          oldActorId,
          oldActorItems.filter((id: string) => id !== itemId)
        );
      }
      const newActorItems = this.itemsByActorId.get(updates.actorId) || [];
      if (!newActorItems.includes(itemId)) {
        this.itemsByActorId.set(updates.actorId, [...newActorItems, itemId]);
      }
    }

    // WICHTIG: Map-Mutation explizit triggern (für Svelte-Reaktivität)
    if (hasChanges) {
      this.itemsById.set(itemId, item); // Re-trigger Reaktivität
    }
  }

  getActor(actorId: string): ActorSnapshot | undefined {
    return this.actorsById.get(actorId);
  }

  getItem(itemId: string): ItemSnapshot | undefined {
    return this.itemsById.get(itemId);
  }

  getItemsByActorId(actorId: string): ReadonlyArray<string> {
    return this.itemsByActorId.get(actorId) || [];
  }
}

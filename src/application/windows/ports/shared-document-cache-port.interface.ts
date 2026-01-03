/**
 * ISharedDocumentCache - Globaler Cache für Shared Document State (Application-Port, engine-agnostisch)
 *
 * WICHTIG:
 * - `GlobalDocumentCache` ist eine **Infrastructure-Implementierung** von `ISharedDocumentCache`.
 * - Core (HookBridge, Controller) spricht nur mit dem **Port** (`ISharedDocumentCache`), nicht mit RuneState direkt.
 * - `GlobalDocumentCache` ist ein **Mirror**, kein Authority Store.
 * - Writes erfolgen ausschließlich über Services + PersistAdapter.
 * - Foundry DB bleibt die letzte Instanz (Source of Truth).
 * - **GlobalDocumentCache darf niemals Actions auslösen** - er ist rein passiv (Hook → Patch → UI).
 */

/**
 * ActorSnapshot - Serialisierter Snapshot eines Actors (Plain Object, nicht Foundry Document)
 */
export interface ActorSnapshot {
  readonly id: string;
  readonly name: string;
  readonly system: Record<string, unknown>;
  readonly flags: Record<string, unknown>;
  // ... weitere relevante Felder
}

/**
 * ItemSnapshot - Serialisierter Snapshot eines Items (Plain Object, nicht Foundry Document)
 */
export interface ItemSnapshot {
  readonly id: string;
  readonly name: string;
  readonly system: Record<string, unknown>;
  readonly flags: Record<string, unknown>;
  readonly actorId?: string;
  // ... weitere relevante Felder
}

/**
 * ISharedDocumentCache - Port für Shared Document State Cache
 */
export interface ISharedDocumentCache {
  /**
   * Aktualisiert einen Actor-Snapshot im Cache (idempotent).
   *
   * @param actorId - Actor-ID
   * @param updates - Partial ActorSnapshot
   */
  patchActor(actorId: string, updates: Partial<ActorSnapshot>): void;

  /**
   * Aktualisiert einen Item-Snapshot im Cache (idempotent).
   *
   * @param itemId - Item-ID
   * @param updates - Partial ItemSnapshot
   */
  patchItem(itemId: string, updates: Partial<ItemSnapshot>): void;

  /**
   * Holt einen Actor-Snapshot aus dem Cache.
   *
   * @param actorId - Actor-ID
   * @returns ActorSnapshot oder undefined
   */
  getActor(actorId: string): ActorSnapshot | undefined;

  /**
   * Holt einen Item-Snapshot aus dem Cache.
   *
   * @param itemId - Item-ID
   * @returns ItemSnapshot oder undefined
   */
  getItem(itemId: string): ItemSnapshot | undefined;

  /**
   * Holt alle Item-IDs für einen Actor.
   *
   * @param actorId - Actor-ID
   * @returns Array von Item-IDs
   */
  getItemsByActorId(actorId: string): ReadonlyArray<string>;
}

import type { IWindowState } from "@/domain/windows/types/view-model.interface";

/**
 * RuneState<T> - Reference Implementation von IWindowState für Svelte (Svelte 5 Runes)
 *
 * Nutzt Svelte 5 `$state()` direkt (möglich, weil diese Datei .svelte.ts ist).
 * `get()` liefert bewusst den reaktiven $state-Proxy zurück, nicht einen Snapshot!
 * Svelte reagiert automatisch auf Änderungen am Proxy.
 */
export class RuneState<T extends Record<string, unknown>> implements IWindowState<T> {
  private readonly runeState: T;

  constructor(initial: T) {
    // $state rune is available here because this is a .svelte.ts file
    // The Svelte compiler will transform this at compile time
    this.runeState = $state(initial);
  }

  get(): Readonly<T> {
    // WICHTIG: Gibt bewusst den reaktiven $state-Proxy zurück, nicht einen Snapshot!
    // Svelte reagiert automatisch auf Änderungen am Proxy.
    // Für Serialisierung/Cloning: snapshot() verwenden.
    return this.runeState as Readonly<T>;
  }

  patch(updates: Partial<T>): void {
    // Idempotent: nur ändern wenn value differs (verhindert unnötige Reaktionen)
    // type-coverage:ignore-next-line
    for (const [key, value] of Object.entries(updates)) {
      const currentValue = this.runeState[key as keyof T];
      // type-coverage:ignore-next-line
      if (currentValue !== value) {
        (this.runeState as Record<string, unknown>)[key] = value;
      }
    }
  }

  subscribe(_fn: (value: Readonly<T>) => void): () => void {
    // Optional: Für Nicht-Svelte Engines (EventBus)
    // Svelte braucht es meist nicht, reagiert automatisch auf RuneState
    return () => {}; // No-op für Svelte
  }

  snapshot(): Readonly<T> {
    // Strukturierter Clone für Non-Svelte Engines
    return { ...this.runeState };
  }
}

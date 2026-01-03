import type { IWindowState } from "@/domain/windows/types/view-model.interface";
import { castSvelteStateRune } from "@/infrastructure/adapters/foundry/runtime-casts";

/**
 * RuneState<T> - Reference Implementation von IWindowState für Svelte (Svelte 5 Runes)
 *
 * Nutzt Svelte 5 `$state()` intern.
 * `get()` liefert bewusst den reaktiven $state-Proxy zurück, nicht einen Snapshot!
 * Svelte reagiert automatisch auf Änderungen am Proxy.
 */
export class RuneState<T extends Record<string, unknown>> implements IWindowState<T> {
  private readonly runeState: T;

  constructor(initial: T) {
    // $state is a Svelte 5 rune, available at compile time
    // Intern: $state-Objekt (Svelte 5 Runes)
    // Type-safe cast: Use runtime cast helper for Svelte 5 $state rune
    const $stateResult = castSvelteStateRune();
    if (!$stateResult.ok) {
      throw new Error(`Svelte 5 $state rune not available: ${$stateResult.error.message}`);
    }

    this.runeState = $stateResult.value(initial);
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

import { vi } from "vitest";
import type { Result, Ok, Err } from "@/types/result";
import { createMockGame, createMockHooks, createMockUI } from "../mocks/foundry";

/**
 * Type-safe Result assertion helpers
 */

/**
 * Asserts that a Result is Ok and returns the value
 */
export function expectResultOk<T>(result: Result<T, unknown>): asserts result is Ok<T> {
  if (!result.ok) {
    throw new Error(`Expected Result to be OK, but got error: ${JSON.stringify(result.error)}`);
  }
}

/**
 * Asserts that a Result is Err and returns the error
 */
export function expectResultErr<E>(result: Result<unknown, E>): asserts result is Err<E> {
  if (result.ok) {
    throw new Error(`Expected Result to be Err, but got value: ${JSON.stringify(result.value)}`);
  }
}

/**
 * Type definitions for Foundry globals
 */
export type MockFoundryGlobals = {
  game?: ReturnType<typeof createMockGame>;
  Hooks?: ReturnType<typeof createMockHooks> | undefined;
  ui?: ReturnType<typeof createMockUI> | undefined;
};

/**
 * Setup/Cleanup-Helper für globale Foundry-Mocks
 *
 * KRITISCH: Mocks werden pro Test gesetzt, nicht global!
 * Erlaubt Tests verschiedener Szenarien (Hooks available, undefined, etc.)
 *
 * @param overrides - Optionale Overrides für Default-Mocks
 * @returns Cleanup-Funktion die Mocks entfernt
 *
 * @example
 * ```typescript
 * it('test case', () => {
 *   const cleanup = withFoundryGlobals({ Hooks: undefined });
 *   // Test code...
 *   cleanup();
 * });
 * ```
 */
export function withFoundryGlobals(overrides: Partial<MockFoundryGlobals> = {}): () => void {
  const globals: MockFoundryGlobals = {
    game: createMockGame(),
    Hooks: createMockHooks(),
    ...overrides,
  };

  Object.entries(globals).forEach(([key, value]) => {
    if (value !== undefined) {
      vi.stubGlobal(key, value);
    }
  });

  return () => {
    vi.unstubAllGlobals();
  };
}

/**
 * Erstellt DOM-Struktur für UI-Tests
 * @param htmlString - HTML-String der eingefügt werden soll
 * @param selector - Optional: CSS-Selector um ein spezifisches Element zurückzugeben
 * @returns Container-Element und optional das gefundene Element
 */
export function createMockDOM(
  htmlString: string,
  selector?: string
): {
  container: HTMLElement;
  element?: HTMLElement | null;
} {
  const container = document.createElement("div");
  container.innerHTML = htmlString;

  if (selector) {
    const element = container.querySelector(selector) as HTMLElement | null;
    return { container, element };
  }

  return { container };
}

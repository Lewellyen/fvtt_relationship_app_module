/**
 * Vitest Test Setup
 *
 * KRITISCH: Setzt KEINE globalen Hooks/game Mocks!
 * init-solid.ts führt Bootstrap sofort aus (Zeile 27-36).
 * Globale Mocks würden Tests der Branches "Hooks nicht verfügbar" (Zeile 41)
 * und "Bootstrap-Fehler" (Zeile 32-35) verhindern.
 *
 * Stattdessen verwenden Tests den withFoundryGlobals() Helper
 * aus test/utils/test-helpers.ts für Per-Test-Mock-Setup.
 */

// Vitest globals sind bereits durch vitest.config.ts aktiviert
// Keine globalThis-Mocks hier!

// Mock Svelte 5 $state rune for tests
// Svelte runes are compile-time features, but we need a runtime mock for tests
// This allows RuneState and GlobalDocumentCache to work in test environments
if (typeof globalThis.$state === "undefined") {
  // Simple mock: just return the value as-is (no reactivity in tests)
  (globalThis as Record<string, unknown>).$state = <T>(initial: T): T => {
    return initial;
  };
}

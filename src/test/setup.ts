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




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

// Mock foundry global for DataModel/Sheet classes
// DataModels extend foundry.abstract.TypeDataModel which is evaluated at import time
// This mock allows DataModel classes to be imported in tests
if (typeof (globalThis as { foundry?: unknown }).foundry === "undefined") {
  (globalThis as Record<string, unknown>).foundry = {
    abstract: {
      TypeDataModel: class {},
    },
    applications: {
      apps: {
        DocumentSheetConfig: {
          registerSheet: () => {},
        },
      },
      sheets: {
        journal: {
          JournalEntryPageHandlebarsSheet: class {},
        },
      },
    },
    data: {
      fields: {},
    },
  };
}

// Mock CONFIG global for DataModel registration
if (typeof (globalThis as { CONFIG?: unknown }).CONFIG === "undefined") {
  (globalThis as Record<string, unknown>).CONFIG = {
    JournalEntryPage: {
      dataModels: {},
    },
  };
}

// Mock JournalEntryPage global for Sheet registration
if (typeof (globalThis as { JournalEntryPage?: unknown }).JournalEntryPage === "undefined") {
  (globalThis as Record<string, unknown>).JournalEntryPage = class {};
}

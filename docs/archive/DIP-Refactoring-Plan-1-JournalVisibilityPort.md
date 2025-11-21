# DIP-Refactoring Plan 1: Journal-Logik an Foundry-Facade gekoppelt

**Datum:** 2025-01-27  
**Betroffene Komponenten:** `JournalVisibilityService`, `FoundryJournalFacade`  
**Ziel:** Entkopplung der Domäne von Foundry-spezifischen Typen durch Einführung eines `JournalVisibilityPort`

---

## Problembeschreibung

### DIP-Verletzung

Der `JournalVisibilityService` verarbeitet Geschäftslogik, ist aber direkt an Foundry-spezifische Abstraktionen gekoppelt:

1. **FoundryJournalFacade**: Verwendet Foundry-spezifische Typen (`FoundryJournalEntry`, `FoundryError`)
2. **Direkte Foundry-Typen**: `FoundryJournalEntry`, `FoundryError` sind in der Domäne bekannt
3. **Fehlende Abstraktion**: Kein domänenneutraler Port für Journal-Operations

**Aktuelle Situation:**

```typescript
// src/services/JournalVisibilityService.ts (aktuell)
export class JournalVisibilityService {
  constructor(
    private readonly facade: FoundryJournalFacade, // ❌ Foundry-spezifisch
    private readonly notificationCenter: NotificationCenter,
    private readonly cacheService: CacheService
  ) {}

  getHiddenJournalEntries(): Result<FoundryJournalEntry[], FoundryError> { // ❌ Foundry-Typen
    // ... verwendet FoundryJournalEntry direkt
  }

  processJournalDirectory(htmlElement: HTMLElement): Result<void, FoundryError> { // ❌ FoundryError
    // ... verwendet FoundryJournalFacade.removeJournalElement()
  }
}
```

**Probleme:**
- Domäne ist an Foundry gebunden
- Nicht testbar ohne Foundry-Mocks
- Nicht austauschbar für andere VTTs/Frameworks
- Foundry-spezifische Typen in Geschäftslogik

---

## Ziel-Architektur

### Port-Adapter-Pattern

```
┌─────────────────────────────────────┐
│   JournalVisibilityService          │  (Domäne)
│   - getHiddenEntries()              │
│   - processDirectory()              │
│                                     │
│   Depends on:                       │
│   → JournalVisibilityPort (Port)   │  ← Abstraktion
└──────────────┬──────────────────────┘
               │
               │ implements
               ▼
┌─────────────────────────────────────┐
│   FoundryJournalVisibilityAdapter   │  (Infrastruktur)
│   - getHiddenEntries()              │
│   - processDirectory()              │
│                                     │
│   Uses:                             │
│   → FoundryJournalFacade            │
└─────────────────────────────────────┘
```

### Domänentypen vs. Foundry-Typen

**Domänentypen (neu):**
- `JournalEntry` - domänenneutral
- `JournalVisibilityError` - domänenspezifische Fehler
- `JournalVisibilityPort` - Interface für Journal-Operations

**Foundry-Typen (bleiben in Adapter):**
- `FoundryJournalEntry` - nur im Adapter
- `FoundryError` - nur im Adapter
- Mapping zwischen Domäne ↔ Foundry im Adapter

---

## Schritt-für-Schritt Refactoring

### Phase 1: Port-Interface definieren

#### 1.1 JournalEntry Domain Model erstellen

**Datei:** `src/core/domain/journal-entry.ts`

```typescript
/**
 * Domain model for journal entry.
 * Platform-agnostic representation of a journal entry.
 */
export interface JournalEntry {
  readonly id: string;
  readonly name: string | null;
}

/**
 * Domain error for journal visibility operations.
 */
export type JournalVisibilityError =
  | { code: "ENTRY_NOT_FOUND"; entryId: string; message: string }
  | { code: "FLAG_READ_FAILED"; entryId: string; message: string }
  | { code: "DOM_MANIPULATION_FAILED"; entryId: string; message: string }
  | { code: "INVALID_ENTRY_DATA"; message: string };
```

#### 1.2 JournalVisibilityPort Interface definieren

**Datei:** `src/core/ports/journal-visibility-port.interface.ts`

```typescript
import type { Result } from "@/types/result";
import type { JournalEntry, JournalVisibilityError } from "@/core/domain/journal-entry";

/**
 * Port for journal visibility operations.
 * 
 * Abstraction that allows the domain to work with journal entries
 * without knowing about the underlying platform (Foundry).
 * 
 * Implementations should be placed in platform-specific adapters
 * (e.g., foundry/adapters/FoundryJournalVisibilityAdapter).
 */
export interface JournalVisibilityPort {
  /**
   * Gets all journal entries from the platform.
   * @returns Result with array of journal entries or error
   */
  getAllEntries(): Result<JournalEntry[], JournalVisibilityError>;

  /**
   * Reads a boolean flag from a journal entry.
   * @param entry - The journal entry
   * @param flagKey - The flag key to read
   * @returns Result with flag value (null if not set) or error
   */
  getEntryFlag(
    entry: JournalEntry,
    flagKey: string
  ): Result<boolean | null, JournalVisibilityError>;

  /**
   * Removes a journal entry from the DOM.
   * @param entryId - The journal entry ID
   * @param entryName - The journal entry name (for logging)
   * @param htmlElement - The HTML container element
   * @returns Result indicating success or error
   */
  removeEntryFromDOM(
    entryId: string,
    entryName: string | null,
    htmlElement: HTMLElement
  ): Result<void, JournalVisibilityError>;
}
```

#### 1.3 Port Token erstellen

**Datei:** `src/tokens/tokenindex.ts` (ergänzen)

```typescript
export const journalVisibilityPortToken = createToken<JournalVisibilityPort>(
  "journalVisibilityPort"
);
```

---

### Phase 2: Foundry-Adapter implementieren

#### 2.1 FoundryJournalVisibilityAdapter erstellen

**Datei:** `src/foundry/adapters/foundry-journal-visibility-adapter.ts`

```typescript
import type { JournalVisibilityPort } from "@/core/ports/journal-visibility-port.interface";
import type { JournalEntry, JournalVisibilityError } from "@/core/domain/journal-entry";
import type { Result } from "@/types/result";
import type { FoundryJournalFacade } from "@/foundry/facades/foundry-journal-facade.interface";
import type { FoundryJournalEntry } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { BOOLEAN_FLAG_SCHEMA } from "@/foundry/validation/setting-schemas";
import { MODULE_CONSTANTS } from "@/constants";
import { foundryJournalFacadeToken } from "@/foundry/foundrytokens";

/**
 * Foundry-specific adapter for JournalVisibilityPort.
 * 
 * Translates between domain types (JournalEntry) and Foundry types (FoundryJournalEntry).
 */
export class FoundryJournalVisibilityAdapter implements JournalVisibilityPort {
  constructor(private readonly foundryJournalFacade: FoundryJournalFacade) {}

  getAllEntries(): Result<JournalEntry[], JournalVisibilityError> {
    const result = this.foundryJournalFacade.getJournalEntries();
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "INVALID_ENTRY_DATA",
          message: result.error.message,
        },
      };
    }

    // Map FoundryJournalEntry → JournalEntry
    const entries: JournalEntry[] = result.value.map((foundryEntry) => ({
      id: foundryEntry.id,
      name: foundryEntry.name ?? null,
    }));

    return { ok: true, value: entries };
  }

  getEntryFlag(
    entry: JournalEntry,
    flagKey: string
  ): Result<boolean | null, JournalVisibilityError> {
    // Find FoundryJournalEntry by ID (we need to fetch all to find the right one)
    const foundryEntriesResult = this.foundryJournalFacade.getJournalEntries();
    if (!foundryEntriesResult.ok) {
      return {
        ok: false,
        error: {
          code: "FLAG_READ_FAILED",
          entryId: entry.id,
          message: foundryEntriesResult.error.message,
        },
      };
    }

    const foundryEntry = foundryEntriesResult.value.find((e) => e.id === entry.id);
    if (!foundryEntry) {
      return {
        ok: false,
        error: {
          code: "ENTRY_NOT_FOUND",
          entryId: entry.id,
          message: `Journal entry with ID ${entry.id} not found`,
        },
      };
    }

    const flagResult = this.foundryJournalFacade.getEntryFlag<boolean>(
      foundryEntry,
      flagKey,
      BOOLEAN_FLAG_SCHEMA
    );

    if (!flagResult.ok) {
      return {
        ok: false,
        error: {
          code: "FLAG_READ_FAILED",
          entryId: entry.id,
          message: flagResult.error.message,
        },
      };
    }

    return { ok: true, value: flagResult.value };
  }

  removeEntryFromDOM(
    entryId: string,
    entryName: string | null,
    htmlElement: HTMLElement
  ): Result<void, JournalVisibilityError> {
    const result = this.foundryJournalFacade.removeJournalElement(
      entryId,
      entryName ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME,
      htmlElement
    );

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "DOM_MANIPULATION_FAILED",
          entryId,
          message: result.error.message,
        },
      };
    }

    return { ok: true, value: undefined };
  }
}

// DI-Wrapper
export class DIFoundryJournalVisibilityAdapter extends FoundryJournalVisibilityAdapter {
  static dependencies = [foundryJournalFacadeToken] as const;

  constructor(foundryJournalFacade: FoundryJournalFacade) {
    super(foundryJournalFacade);
  }
}
```

**Hinweis:** Die Mapping-Logik zwischen `JournalEntry` ↔ `FoundryJournalEntry` könnte optimiert werden (Caching), ist aber für MVP ausreichend.

---

### Phase 3: Service refactoren

#### 3.1 JournalVisibilityService anpassen

**Datei:** `src/services/JournalVisibilityService.ts`

Die Klasse wird angepasst, um `JournalVisibilityPort` statt `FoundryJournalFacade` zu verwenden:

**Änderungen:**
1. Constructor-Parameter: `facade: FoundryJournalFacade` → `port: JournalVisibilityPort`
2. Rückgabetypen: `FoundryJournalEntry[]` → `JournalEntry[]`, `FoundryError` → `JournalVisibilityError`
3. Methodenaufrufe: `facade.getJournalEntries()` → `port.getAllEntries()`, etc.
4. DI-Dependencies: `foundryJournalFacadeToken` → `journalVisibilityPortToken`

**Details:** Siehe vollständigen Code in Phase 3.1 des ursprünglichen Plans.

---

### Phase 4: DI-Konfiguration anpassen

#### 4.1 Adapter registrieren

**Datei:** `src/config/modules/foundry-services.config.ts` (ergänzen)

```typescript
import { DIFoundryJournalVisibilityAdapter } from "@/foundry/adapters/foundry-journal-visibility-adapter";
import { journalVisibilityPortToken } from "@/tokens/tokenindex";

export function registerFoundryServices(container: ServiceContainer): Result<void, string> {
  // ... bestehende Registrierungen ...

  // Register FoundryJournalVisibilityAdapter
  const adapterResult = container.registerClass(
    journalVisibilityPortToken,
    DIFoundryJournalVisibilityAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(adapterResult)) {
    return err(`Failed to register JournalVisibilityAdapter: ${adapterResult.error.message}`);
  }

  // ... rest ...
}
```

#### 4.2 JournalVisibilityService Token anpassen

Die Registrierung von `JournalVisibilityService` bleibt unverändert, aber der Service verwendet jetzt intern den Port.

---

## Migration-Pfad

### Schritt 1: Neue Dateien erstellen (keine Breaking Changes)
- ✅ `src/core/domain/journal-entry.ts` erstellen
- ✅ `src/core/ports/journal-visibility-port.interface.ts` erstellen
- ✅ `src/foundry/adapters/foundry-journal-visibility-adapter.ts` erstellen
- ✅ Token registrieren

### Schritt 2: Parallele Implementierung
- ✅ Adapter registrieren (neben bestehender Facade)
- ✅ Tests für Adapter schreiben
- ✅ Integration-Tests mit neuem Port

### Schritt 3: Service migrieren
- ✅ `JournalVisibilityService` auf Port umstellen
- ✅ DI-Dependencies anpassen
- ✅ Alle Tests aktualisieren

### Schritt 4: Alte Dependencies entfernen
- ⚠️ `FoundryJournalFacade` aus `JournalVisibilityService` entfernen
- ⚠️ Foundry-Typen aus Service entfernen
- ✅ Alte Tests aufräumen

### Schritt 5: Cleanup
- ✅ Facade nur noch von Adapter nutzen
- ✅ Foundry-Typen nur noch in Adapter

---

## Test-Strategie

### Unit-Tests

#### JournalVisibilityPort Interface Mock

```typescript
// src/core/ports/__tests__/journal-visibility-port.mock.ts
export const createMockJournalVisibilityPort = (): JournalVisibilityPort => ({
  getAllEntries: vi.fn(),
  getEntryFlag: vi.fn(),
  removeEntryFromDOM: vi.fn(),
});
```

#### Service-Test (ohne Foundry-Mocks)

```typescript
// src/services/__tests__/JournalVisibilityService.test.ts
describe("JournalVisibilityService", () => {
  it("should get hidden entries using port", () => {
    const mockPort = createMockJournalVisibilityPort();
    const service = new JournalVisibilityService(
      mockPort, // ✅ Port-Mock statt Foundry-Facade
      mockNotificationCenter,
      mockCacheService
    );

    // Test mit domänentypen
    const entries: JournalEntry[] = [
      { id: "1", name: "Entry 1" },
      { id: "2", name: "Entry 2" },
    ];

    vi.mocked(mockPort.getAllEntries).mockReturnValue({ ok: true, value: entries });
    vi.mocked(mockPort.getEntryFlag).mockReturnValue({ ok: true, value: true });

    const result = service.getHiddenJournalEntries();

    expect(result.ok).toBe(true);
    expect(mockPort.getAllEntries).toHaveBeenCalled();
  });
});
```

#### Adapter-Test (Foundry-Mocks)

```typescript
// src/foundry/adapters/__tests__/foundry-journal-visibility-adapter.test.ts
describe("FoundryJournalVisibilityAdapter", () => {
  it("should map FoundryJournalEntry to JournalEntry", () => {
    const mockFacade = createMockFoundryJournalFacade();
    const adapter = new FoundryJournalVisibilityAdapter(mockFacade);

    const foundryEntries: FoundryJournalEntry[] = [
      { id: "1", name: "Entry 1" },
      { id: "2", name: null },
    ];

    vi.mocked(mockFacade.getJournalEntries).mockReturnValue({
      ok: true,
      value: foundryEntries,
    });

    const result = adapter.getAllEntries();

    expect(result.ok).toBe(true);
    expect(result.value).toEqual([
      { id: "1", name: "Entry 1" },
      { id: "2", name: null },
    ]);
  });
});
```

---

## Breaking Changes

### ⚠️ Keine Breaking Changes für externe APIs

- ✅ `JournalVisibilityService` behält öffentliche Methoden
- ✅ Rückgabetypen ändern sich nur intern (Result-Types)
- ✅ Externe Consumer sehen keine Änderungen

### ⚠️ Interne Breaking Changes

- ⚠️ `DIJournalVisibilityService` ändert Dependencies:
  - **Vorher:** `foundryJournalFacadeToken`
  - **Nachher:** `journalVisibilityPortToken`
- ⚠️ DI-Config muss angepasst werden

### Migration für Tests

Tests, die `FoundryJournalFacade` mocken, müssen auf `JournalVisibilityPort` umgestellt werden:

```typescript
// Vorher
const mockFacade = createMockFoundryJournalFacade();
const service = new JournalVisibilityService(mockFacade, ...);

// Nachher
const mockPort = createMockJournalVisibilityPort();
const service = new JournalVisibilityService(mockPort, ...);
```

---

## Vorteile nach Refactoring

### ✅ DIP-Konformität
- Domäne hängt nicht mehr an Foundry
- Port abstrahiert Platform-Details
- Austauschbar für andere VTTs

### ✅ Testbarkeit
- Service testbar ohne Foundry-Mocks
- Adapter testbar mit Foundry-Mocks
- Klare Trennung der Concerns

### ✅ Wartbarkeit
- Geschäftslogik getrennt von Infrastruktur
- Änderungen an Foundry-API nur im Adapter
- Domänentypen klar definiert

### ✅ Erweiterbarkeit
- Neue Platform-Adapters einfach hinzufügbar
- Port kann erweitert werden ohne Domäne zu ändern

---

## Offene Fragen / Follow-ups

1. **Performance:** Sollten wir Caching im Adapter einführen, um `getAllEntries()` nicht mehrfach zu rufen?
2. **Error-Mapping:** Sollen wir FoundryErrors detaillierter auf `JournalVisibilityError` mappen?
3. **Entry-Lookup:** Sollte `getEntryFlag` direkt ein Entry-Objekt nehmen statt ID-Lookup?

---

## Schätzung

- **Aufwand:** ~4-6 Stunden
- **Komplexität:** Mittel
- **Risiko:** Niedrig (parallele Implementierung möglich)
- **Breaking Changes:** Minimal (nur interne DI-Struktur)

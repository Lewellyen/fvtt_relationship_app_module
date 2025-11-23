# DIP-Refactoring Plan 4: JournalCacheInvalidationHook nutzt Foundry-Globals

**Datum:** 2025-01-27 (Aktualisiert: 2025-11-21)  
**Betroffene Komponenten:** `JournalCacheInvalidationHook` → `InvalidateJournalCacheOnChangeUseCase`  
**Status:** ✅ **VOLLSTÄNDIG ERLEDIGT** - Clean Architecture mit PlatformUIPort, Event-System und UI-Re-Render vollständig platform-agnostisch  
**Ziel:** Eliminierung direkter Foundry-Global-Zugriffe durch konsequente Nutzung der bereits injizierten Services

---

## ✅ Update 2025-11-21: Phase 2 - Clean Architecture UI-Port

**Was wurde erreicht:**
- ✅ PlatformUIPort im Domain Layer erstellt (konsistent mit JournalEventPort)
- ✅ FoundryUIAdapter im Infrastructure Layer als Implementierung
- ✅ TriggerJournalDirectoryReRenderUseCase nutzt PlatformUIPort
- ✅ JournalVisibilityService migriert auf PlatformUIPort
- ✅ Vollständige Schichtentrennung: Application → Domain Ports ← Infrastructure
- ✅ 100% Test Coverage für alle neuen Komponenten
- ✅ Vorbereitet für Multi-VTT: Roll20/Fantasy Grounds können eigene UIAdapter implementieren
- ✅ UI-Re-Render-Funktionalität wiederhergestellt

## ✅ Update 2025-11-21: Event-System Refactoring (Phase 1)

**Was wurde erreicht:**
- ✅ `JournalCacheInvalidationHook` wurde durch `InvalidateJournalCacheOnChangeUseCase` ersetzt
- ✅ Hook arbeitet jetzt über `JournalEventPort` (platform-agnostisch) statt direkt mit `FoundryHooks`
- ✅ Keine direkten Foundry-Hook-Aufrufe mehr
- ✅ `game.journal`-Zugriffe wurden durch Event-basierte Architektur ersetzt
- ✅ Vollständig testbar ohne Foundry-Globals

**Verbleibende DIP-Verletzungen:** Keine!

**Siehe:** [phase-1-event-system-refactoring.md](phases/phase-1-event-system-refactoring.md)

---

## Problembeschreibung

### DIP-Verletzung

Der `JournalCacheInvalidationHook` erhält `FoundryGame`, `FoundryHooks` und `FoundryUI` via Dependency Injection, nutzt aber trotzdem direkt die Foundry-Globals `game`, `ui` und `Hooks`:

**Aktuelle Situation:**

```typescript
// src/application/use-cases/journal-cache-invalidation-hook.ts

export class JournalCacheInvalidationHook implements HookRegistrar {
  constructor(
    private readonly hooks: FoundryHooks,        // ✅ Injiziert
    private readonly cache: CacheService,
    private readonly notificationCenter: NotificationCenter,
    private readonly foundryGame: FoundryGame,   // ✅ Injiziert
    private readonly journalVisibility: JournalVisibilityService
  ) {}

  // ❌ ABER: Nutzt trotzdem direkt Foundry-Globals!
  
  private checkHiddenFlagChanged(entryId: string): boolean {
    // Zeile 120
    if (typeof game === "undefined" || !game?.journal) return false;  // ❌
    const entry = game.journal.get(entryId);  // ❌ Direkter game-Zugriff
    // ...
  }

  private getHiddenFlagValue(entryId: string): boolean | null {
    // Zeile 153
    if (typeof game === "undefined" || !game?.journal) return null;  // ❌
    const entry = game.journal.get(entryId);  // ❌ Direkter game-Zugriff
    // ...
  }

  private rerenderJournalDirectory(): boolean {
    // Zeile 234
    if (typeof ui === "undefined" || !ui) {  // ❌ Direkter ui-Zugriff
      return false;
    }
    const sidebar = ui.sidebar;  // ❌ Direkter ui-Zugriff
    
    // Zeile 279
    if (typeof Hooks !== "undefined" && typeof Hooks.call === "function") {  // ❌
      Hooks.call(...);  // ❌ Direkter Hooks-Zugriff
    }
  }
}
```

**Probleme:**
- ❌ **Inkonsistent**: Constructor bekommt Services injiziert, nutzt sie aber nicht überall
- ❌ **DIP-Verletzung**: Application-Layer greift direkt auf Infrastructure-Globals zu
- ❌ **Nicht testbar**: Methoden können nicht isoliert getestet werden ohne Foundry-Mocks
- ❌ **Fragil**: Änderungen an Foundry-API brechen Code an unerwarteten Stellen

### Warum ist das besonders problematisch?

Der Hook **hat bereits** die benötigten Services als Dependencies:
- ✅ `FoundryGame` ist injiziert → Sollte für `game.journal.get()` genutzt werden
- ✅ `FoundryHooks` ist injiziert → Sollte für `Hooks.call()` genutzt werden
- ❌ `FoundryUI` fehlt als Dependency → Muss nachträglich hinzugefügt werden

Dies ist ein **Konsistenzproblem** innerhalb derselben Klasse!

---

## Ziel-Architektur

### Konsequente Service-Nutzung

```
JournalCacheInvalidationHook
  ↓ uses (DI)
  ├─ FoundryGame → getJournalEntryById()
  ├─ FoundryHooks → call()
  └─ FoundryUI (neu) → rerenderJournalDirectory()
```

**Prinzip:** Alle Foundry-API-Aufrufe gehen über die injizierten Services, **keine** direkten Global-Zugriffe.

---

## Schritt-für-Schritt Refactoring

### Phase 1: FoundryUI als Dependency hinzufügen

#### 1.1 Constructor erweitern

**Datei:** `src/application/use-cases/journal-cache-invalidation-hook.ts`

```typescript
export class JournalCacheInvalidationHook implements HookRegistrar {
  constructor(
    private readonly hooks: FoundryHooks,
    private readonly cache: CacheService,
    private readonly notificationCenter: NotificationCenter,
    private readonly foundryGame: FoundryGame,
    private readonly foundryUI: FoundryUI,  // ✅ NEU
    private readonly journalVisibility: JournalVisibilityService
  ) {}
}
```

#### 1.2 DI-Wrapper anpassen

```typescript
export class DIJournalCacheInvalidationHook extends JournalCacheInvalidationHook {
  static dependencies = [
    foundryHooksToken,
    cacheServiceToken,
    notificationCenterToken,
    foundryGameToken,
    foundryUIToken,  // ✅ NEU
    journalVisibilityServiceToken,
  ] as const;

  constructor(
    hooks: FoundryHooks,
    cache: CacheService,
    notificationCenter: NotificationCenter,
    foundryGame: FoundryGame,
    foundryUI: FoundryUI,  // ✅ NEU
    journalVisibility: JournalVisibilityService
  ) {
    super(hooks, cache, notificationCenter, foundryGame, foundryUI, journalVisibility);
  }
}
```

---

### Phase 2: checkHiddenFlagChanged() refactoren

#### 2.1 Aktueller Code (Problematisch)

```typescript
private checkHiddenFlagChanged(entryId: string): boolean {
  try {
    // ❌ Direkter Global-Zugriff
    if (typeof game === "undefined" || !game?.journal) return false;
    const entry = game.journal.get(entryId);
    if (!entry) return false;

    // Type Guard + Cast
    if (!("getFlag" in entry)) return false;
    const getFlagMethod = castCacheValue<(scope: string, key: string) => unknown>(entry.getFlag);
    const hiddenFlag = castCacheValue<boolean | undefined | null>(
      getFlagMethod(MODULE_CONSTANTS.MODULE.ID, MODULE_CONSTANTS.FLAGS.HIDDEN)
    );
    return hiddenFlag === true || hiddenFlag === false;
  } catch (error) {
    // ...
    return false;
  }
}
```

#### 2.2 Refactored (DIP-konform)

```typescript
private checkHiddenFlagChanged(entryId: string): boolean {
  try {
    // ✅ Nutzt injizierten Service
    const entryResult = this.foundryGame.getJournalEntryById(entryId);
    if (!entryResult.ok) {
      this.notificationCenter.debug(
        "Failed to get journal entry for flag check",
        { error: entryResult.error, entryId },
        { channels: ["ConsoleChannel"] }
      );
      return false;
    }

    const entry = entryResult.value;
    if (!entry) return false;

    // Nutzt Domain-Port für Flag-Zugriff
    const portResult = this.journalVisibility.getEntryFlag(
      { id: entry.id, name: entry.name },
      MODULE_CONSTANTS.FLAGS.HIDDEN
    );

    if (!portResult.ok) return false;
    const hiddenFlag = portResult.value;
    return hiddenFlag === true || hiddenFlag === false;
  } catch (error) {
    this.notificationCenter.debug(
      "Failed to check hidden flag",
      { error: error instanceof Error ? error.message : String(error), entryId },
      { channels: ["ConsoleChannel"] }
    );
    return false;
  }
}
```

**Alternative (wenn FoundryDocument genutzt werden soll):**

```typescript
private checkHiddenFlagChanged(entryId: string): boolean {
  try {
    const entryResult = this.foundryGame.getJournalEntryById(entryId);
    if (!entryResult.ok || !entryResult.value) return false;

    // Nutzt FoundryDocument Service für Flag-Zugriff
    const flagResult = this.foundryDocument.getFlag<boolean>(
      castFoundryDocumentForFlag(entryResult.value),
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.FLAGS.HIDDEN
    );

    if (!flagResult.ok) return false;
    const hiddenFlag = flagResult.value;
    return hiddenFlag === true || hiddenFlag === false;
  } catch (error) {
    // ...
    return false;
  }
}
```

**Hinweis:** Die zweite Variante würde `FoundryDocument` als zusätzliche Dependency benötigen.

---

### Phase 3: getHiddenFlagValue() refactoren

#### 3.1 Refactored

```typescript
private getHiddenFlagValue(entryId: string): boolean | null {
  try {
    // ✅ Nutzt injizierten Service
    const entryResult = this.foundryGame.getJournalEntryById(entryId);
    if (!entryResult.ok || !entryResult.value) return null;

    const entry = entryResult.value;
    const portResult = this.journalVisibility.getEntryFlag(
      { id: entry.id, name: entry.name },
      MODULE_CONSTANTS.FLAGS.HIDDEN
    );

    if (!portResult.ok) return null;
    const hiddenFlag = portResult.value;
    if (hiddenFlag === true || hiddenFlag === false) {
      return hiddenFlag;
    }
    return null;
  } catch (_error) {
    return null;
  }
}
```

**Problem:** `JournalVisibilityService.getEntryFlag()` existiert nicht als public API!

**Lösung 1: JournalVisibilityPort erweitern**

```typescript
// src/domain/ports/journal-visibility-port.interface.ts
export interface JournalVisibilityPort {
  // ... existing methods ...

  /**
   * Gets a boolean flag from a journal entry.
   * @param entryId - The journal entry ID
   * @param flagKey - The flag key to read
   * @returns Result with flag value (null if not set) or error
   */
  getEntryFlagById(
    entryId: string,
    flagKey: string
  ): Result<boolean | null, JournalVisibilityError>;
}
```

**Lösung 2: FoundryDocument als zusätzliche Dependency nutzen** (siehe Phase 2 Alternative)

---

### Phase 4: rerenderJournalDirectory() refactoren

#### 4.1 Aktueller Code (Problematisch)

```typescript
private rerenderJournalDirectory(): boolean {
  try {
    const journalElement = document.querySelector("#journal");  // ✅ OK (DOM)
    if (!journalElement) return false;

    // ❌ Direkter ui-Zugriff
    if (typeof ui === "undefined" || !ui) return false;
    const sidebar = castCacheValue<{ tabs?: { journal?: unknown } }>(ui.sidebar);
    const journalApp = sidebar?.tabs?.journal;

    if (journalApp && typeof journalApp.render === "function") {
      journalApp.render(false);
      return true;
    } else {
      // ❌ Direkter Hooks-Zugriff
      if (typeof Hooks !== "undefined" && typeof Hooks.call === "function") {
        Hooks.call("renderJournalDirectory", ...);
      }
    }
  } catch (error) {
    // ...
  }
}
```

#### 4.2 Refactored (Option 1: Neue FoundryUI-Methode)

**Neue Methode in FoundryUI Interface:**

```typescript
// src/infrastructure/adapters/foundry/interfaces/FoundryUI.ts
export interface FoundryUI {
  // ... existing methods ...

  /**
   * Triggers a re-render of the journal directory if it's currently open.
   * @returns Result indicating success (true if rendered, false if not open) or error
   */
  rerenderJournalDirectory(): Result<boolean, FoundryError>;
}
```

**FoundryUIPortV13 Implementierung:**

```typescript
// src/infrastructure/adapters/foundry/ports/v13/FoundryUIPort.ts
rerenderJournalDirectory(): Result<boolean, FoundryError> {
  try {
    const journalElement = document.querySelector("#journal");
    if (!journalElement) return { ok: true, value: false };

    if (typeof ui === "undefined" || !ui?.sidebar) {
      return { ok: true, value: false };
    }

    const sidebar = ui.sidebar as { tabs?: { journal?: { render?: (force: boolean) => void } } };
    const journalApp = sidebar.tabs?.journal;

    if (journalApp && typeof journalApp.render === "function") {
      journalApp.render(false);
      return { ok: true, value: true };
    }

    return { ok: true, value: false };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UI_OPERATION_FAILED",
        message: `Failed to re-render journal directory: ${error instanceof Error ? error.message : String(error)}`,
        operation: "rerenderJournalDirectory",
      },
    };
  }
}
```

**Hook nutzt dann:**

```typescript
private rerenderJournalDirectory(): boolean {
  // ✅ Nutzt injizierten Service
  const result = this.foundryUI.rerenderJournalDirectory();
  
  if (!result.ok) {
    this.notificationCenter.warn(
      "Failed to re-render journal directory",
      result.error,
      { channels: ["ConsoleChannel"] }
    );
    return false;
  }

  if (result.value) {
    this.notificationCenter.debug(
      "Triggered journal directory re-render after flag update",
      {},
      { channels: ["ConsoleChannel"] }
    );
  }

  return result.value;
}
```

#### 4.3 Refactored (Option 2: Hooks.call via FoundryHooks)

**Neue Methode in FoundryHooks Interface:**

```typescript
// src/infrastructure/adapters/foundry/interfaces/FoundryHooks.ts
export interface FoundryHooks {
  // ... existing methods ...

  /**
   * Manually triggers a hook with arguments.
   * @param hookName - The hook name
   * @param args - Arguments to pass to the hook
   * @returns Result indicating success or error
   */
  call(hookName: string, ...args: unknown[]): Result<void, FoundryError>;
}
```

**Hook nutzt dann:**

```typescript
private rerenderJournalDirectory(): boolean {
  try {
    const journalElement = document.querySelector("#journal");
    if (!journalElement) return false;

    // ✅ Nutzt FoundryUI Service
    const uiResult = this.foundryUI.findElement(
      document.body,
      "ui.sidebar.tabs.journal"
    );

    if (uiResult.ok && uiResult.value) {
      const journalApp = uiResult.value as { render?: (force: boolean) => void };
      if (typeof journalApp.render === "function") {
        journalApp.render(false);
        return true;
      }
    }

    // Fallback: Trigger Hook manually
    // ✅ Nutzt FoundryHooks Service
    const hookResult = this.hooks.call(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      { id: "journal", render: () => {} },
      [journalElement]
    );

    return hookResult.ok;
  } catch (error) {
    // ...
    return false;
  }
}
```

**Empfehlung:** Option 1 ist sauberer (dedizierte UI-Methode).

---

### Phase 5: Tests anpassen

#### 5.1 Test-Setup erweitern

```typescript
// src/application/use-cases/__tests__/journal-cache-invalidation-hook.test.ts

describe("JournalCacheInvalidationHook", () => {
  let mockHooks: Pick<FoundryHooks, "on" | "off" | "call">;  // ✅ call hinzugefügt
  let mockCache: CacheService;
  let mockNotificationCenter: NotificationCenter;
  let mockFoundryGame: FoundryGame;
  let mockFoundryUI: FoundryUI;  // ✅ NEU
  let mockJournalVisibility: JournalVisibilityService;

  beforeEach(() => {
    // ... existing mocks ...
    
    mockFoundryUI = {  // ✅ NEU
      rerenderJournalDirectory: vi.fn().mockReturnValue({ ok: true, value: true }),
      notify: vi.fn(),
      removeJournalElement: vi.fn(),
      findElement: vi.fn(),
    };

    hook = new JournalCacheInvalidationHook(
      mockHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockFoundryUI,  // ✅ NEU
      mockJournalVisibility
    );
  });

  it("should use FoundryGame service instead of game global", () => {
    // Mock Foundry Game Service
    vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue({
      ok: true,
      value: { id: "entry1", name: "Test Entry" },
    });

    // ... test logic ...

    expect(mockFoundryGame.getJournalEntryById).toHaveBeenCalledWith("entry1");
  });

  it("should use FoundryUI service for re-render", () => {
    // Mock successful re-render
    vi.mocked(mockFoundryUI.rerenderJournalDirectory).mockReturnValue({
      ok: true,
      value: true,
    });

    // ... trigger re-render logic ...

    expect(mockFoundryUI.rerenderJournalDirectory).toHaveBeenCalled();
  });
});
```

---

## Migration-Pfad

### Schritt 1: Dependencies erweitern
- ✅ `FoundryUI` als Constructor-Parameter hinzufügen
- ✅ DI-Wrapper anpassen
- ✅ DI-Config aktualisieren (foundryUIToken registrieren)

### Schritt 2: checkHiddenFlagChanged() refactoren
- ✅ `game.journal.get()` durch `this.foundryGame.getJournalEntryById()` ersetzen
- ✅ Flag-Zugriff über `JournalVisibilityPort` oder `FoundryDocument`

### Schritt 3: getHiddenFlagValue() refactoren
- ✅ Analog zu checkHiddenFlagChanged()

### Schritt 4: rerenderJournalDirectory() refactoren
- ✅ `ui` Global durch `this.foundryUI` ersetzen
- ✅ `Hooks.call()` durch `this.hooks.call()` ersetzen (falls nötig)
- ✅ Optional: Neue `FoundryUI.rerenderJournalDirectory()` Methode implementieren

### Schritt 5: Tests aktualisieren
- ✅ Test-Setup mit neuen Mocks erweitern
- ✅ Tests ohne Foundry-Globals laufen lassen
- ✅ Integration-Tests validieren

---

## Breaking Changes

### ⚠️ Keine Breaking Changes für externe APIs

- ✅ `JournalCacheInvalidationHook` behält öffentliche Methoden
- ✅ `HookRegistrar` Interface bleibt unverändert
- ✅ Externe Consumer sehen keine Änderungen

### ⚠️ Interne Breaking Changes

- ⚠️ `DIJournalCacheInvalidationHook` ändert Dependencies:
  - **Vorher:** `[foundryHooksToken, cacheServiceToken, notificationCenterToken, foundryGameToken, journalVisibilityServiceToken]`
  - **Nachher:** `+ foundryUIToken` (neu)
- ⚠️ Tests müssen `FoundryUI` Mock hinzufügen

---

## Vorteile nach Refactoring

### ✅ DIP-Konformität

- ✅ Keine direkten Foundry-Global-Zugriffe mehr
- ✅ Konsequente Nutzung der injizierten Services
- ✅ Konsistent mit Rest der Codebase

### ✅ Testbarkeit

- ✅ Alle Methoden testbar ohne Foundry-Globals
- ✅ Isolierte Tests mit Service-Mocks
- ✅ Keine `globalThis` Manipulationen in Tests nötig

### ✅ Wartbarkeit

- ✅ Änderungen an Foundry-API nur in Ports
- ✅ Type-Safety durch Service-Interfaces
- ✅ Klare Dependency-Struktur

### ✅ Konsistenz

- ✅ Alle Hook-Handler nutzen Services konsistent
- ✅ Keine Inkonsistenz zwischen Constructor und Implementierung

---

## Offene Fragen / Follow-ups

1. **JournalVisibilityPort erweitern?**  
   Soll `getEntryFlagById()` zum Port hinzugefügt werden, oder ist `FoundryDocument` die bessere Dependency?

2. **FoundryUI.rerenderJournalDirectory()?**  
   Soll diese Methode zum `FoundryUI` Interface hinzugefügt werden, oder ist das zu spezifisch?

3. **FoundryHooks.call()?**  
   Wird `call()` Methode generell benötigt, oder ist das ein Edge-Case?

---

## Schätzung

- **Aufwand:** ~2-3 Stunden
- **Komplexität:** Niedrig-Mittel
- **Risiko:** Niedrig (bestehende Tests decken Funktionalität ab)
- **Breaking Changes:** Minimal (nur interne DI-Struktur)

---

## Priorität

**Empfehlung:** 🔴 **Hoch** (vor 1.0.0)

**Begründung:**
- Inkonsistenz innerhalb derselben Klasse
- Services werden injiziert aber nicht genutzt
- Relativ einfach zu fixen
- Verbessert Testbarkeit signifikant


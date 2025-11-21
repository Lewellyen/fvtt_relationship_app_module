# Phase 4: UI-Operations Refactoring

**Datum:** 2025-01-27  
**Priorität:** 🟡 MITTEL  
**Geschätzter Aufwand:** 4-8 Stunden  
**Komplexität:** Niedrig  
**Risiko:** Niedrig  
**Dependencies:** Keine (parallel zu Phase 1-3 möglich)

---

## 🎯 Ziel dieser Phase

UI-Operationen von direkten Foundry-Abhängigkeiten befreien und platform-agnostisch machen:

1. ✅ Generischen `PlatformUIPort` erstellen
2. ✅ `FoundryUIAdapter` implementieren
3. ✅ UIChannel und andere Services von FoundryUI entkoppeln
4. ✅ Tests ohne Foundry-Globals

---

## 📊 IST-Zustand (Probleme)

```typescript
// ❌ PROBLEM 1: UIChannel nutzt direkt FoundryUI
class UIChannel implements NotificationChannel {
  constructor(
    private readonly foundryUI: FoundryUI,  // ❌ Infrastructure!
  ) {}

  send(notification: Notification): Result<void, Error> {
    const result = this.foundryUI.notify(
      notification.message,
      notification.level as "info" | "warning" | "error"
    );
    // ...
  }
}

// ❌ PROBLEM 2: JournalVisibilityService nutzt direkt FoundryUI
class JournalVisibilityService {
  constructor(
    private readonly foundryUI: FoundryUI,  // ❌ Infrastructure!
  ) {}

  removeJournalFromUI(journalId: string, htmlContainer: HTMLElement): void {
    this.foundryUI.removeEntityElement("journal", journalId, htmlContainer);
  }
}

// ❌ PROBLEM 3: UI-Operations sind Foundry-spezifisch
interface FoundryUI {
  notify(message: string, level: "info" | "warning" | "error"): Result<...>;
  removeEntityElement(entityType: string, entityId: string, html: HTMLElement): Result<...>;
  rerenderJournalDirectory(): Result<...>;  // Journal-spezifisch!
}
```

**Konsequenzen:**
- 🔴 UI-Operationen nicht portierbar auf andere Plattformen
- 🔴 Services kennen Foundry-UI-Details
- 🔴 Tests benötigen Foundry-UI-Mocks
- 🔴 Entity-spezifische Methoden führen zu Duplikation

---

## ✅ SOLL-Zustand (Ziel)

```typescript
// ✅ ZIEL 1: UIChannel nutzt Domain-Port
class UIChannel implements NotificationChannel {
  constructor(
    private readonly ui: PlatformUIPort,  // ✅ Domain Port!
  ) {}

  send(notification: Notification): Result<void, Error> {
    return this.ui.notify(
      notification.message,
      notification.level as "info" | "warning" | "error"
    );
  }
}

// ✅ ZIEL 2: JournalVisibilityService nutzt Domain-Port
class JournalVisibilityService {
  constructor(
    private readonly ui: PlatformUIPort,  // ✅ Domain Port!
  ) {}

  removeJournalFromUI(journalId: string, htmlContainer: HTMLElement): void {
    this.ui.removeEntityElement("journal", journalId, htmlContainer);
  }
}

// ✅ ZIEL 3: Generische UI-Operations mit entityType Parameter
interface PlatformUIPort {
  notify(message: string, level: NotificationLevel, options?: NotificationOptions): Result<...>;
  removeEntityElement(entityType: EntityType, entityId: string, html: HTMLElement): Result<...>;
  rerenderDirectory(directoryType: DirectoryType): Result<...>;  // Generisch!
}
```

**Vorteile:**
- ✅ UI-Operationen portierbar (Roll20, Fantasy Grounds)
- ✅ Services sind platform-agnostisch
- ✅ Keine Duplikation bei weiteren Entity-Typen
- ✅ Tests mit einfachen Mock-Ports

---

## 📋 Detaillierte Schritte

### Step 1: Ordnerstruktur vorbereiten

```bash
mkdir -p src/domain/ports
mkdir -p src/infrastructure/adapters/foundry/ui-adapters
```

**Erwartetes Ergebnis:**
```
src/
├─ domain/
│   └─ ports/
│       ├─ events/                       (aus Phase 1)
│       ├─ collections/                  (aus Phase 2)
│       ├─ platform-settings-port.interface.ts  (aus Phase 3)
│       └─ platform-ui-port.interface.ts (NEU)
└─ infrastructure/
    └─ adapters/
        └─ foundry/
            ├─ event-adapters/           (aus Phase 1)
            ├─ collection-adapters/      (aus Phase 2)
            ├─ settings-adapters/        (aus Phase 3)
            └─ ui-adapters/              (NEU)
```

---

### Step 2: Platform-UI-Port erstellen

**Datei:** `src/domain/ports/platform-ui-port.interface.ts`

```typescript
import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic port for UI operations.
 * 
 * Provides notification display, DOM manipulation, and UI refresh operations.
 * Platform-agnostic - works with any VTT system or UI framework.
 * 
 * Platform mappings:
 * - Foundry: ui.notifications, DOM manipulation
 * - Roll20: sendChat, CSS manipulation
 * - Fantasy Grounds: notification system, XML UI updates
 * - Headless: No-op or console logging
 * 
 * @example
 * ```typescript
 * // Show notification
 * ui.notify("Settings saved", "info");
 * 
 * // Remove entity from UI
 * ui.removeEntityElement("journal", "journal-123", htmlContainer);
 * 
 * // Rerender directory
 * ui.rerenderDirectory("journal");
 * ```
 */
export interface PlatformUIPort {
  /**
   * Display a notification to the user.
   * 
   * Platform mappings:
   * - Foundry: ui.notifications.info/warn/error
   * - Roll20: sendChat with /w GM prefix
   * - Fantasy Grounds: Interface.notification()
   * - Headless: console.log/warn/error
   * 
   * @param message - Notification message (localized)
   * @param level - Notification severity
   * @param options - Optional configuration
   * @returns Success or error
   * 
   * @example
   * ```typescript
   * ui.notify("Changes saved successfully", "info", {
   *   permanent: false,
   *   console: true,
   * });
   * ```
   */
  notify(
    message: string,
    level: NotificationLevel,
    options?: NotificationOptions
  ): Result<void, UIError>;

  /**
   * Remove an entity element from the DOM.
   * 
   * Useful for immediate UI updates without full rerender.
   * Headless platforms can no-op this.
   * 
   * Platform mappings:
   * - Foundry: Find and remove .directory-item
   * - Roll20: Find and remove .handout-row
   * - Fantasy Grounds: XML node removal
   * - Headless: No-op
   * 
   * @param entityType - Type of entity (journal, actor, item, etc.)
   * @param entityId - Entity ID
   * @param htmlContainer - Container element to search in
   * @returns Success (true if removed, false if not found) or error
   * 
   * @example
   * ```typescript
   * const result = ui.removeEntityElement("journal", "journal-123", directoryHtml);
   * if (result.ok && result.value) {
   *   console.log("Entity removed from UI");
   * }
   * ```
   */
  removeEntityElement(
    entityType: EntityType,
    entityId: string,
    htmlContainer: HTMLElement
  ): Result<boolean, UIError>;

  /**
   * Trigger a full rerender of an entity directory.
   * 
   * More expensive than removeEntityElement but ensures consistency.
   * 
   * Platform mappings:
   * - Foundry: ui.sidebar.tabs[directoryType].render(true)
   * - Roll20: No-op (directories update automatically)
   * - Fantasy Grounds: Interface.refresh()
   * - Headless: No-op
   * 
   * @param directoryType - Type of directory to rerender
   * @returns Success (true if rerendered, false if not found/supported) or error
   * 
   * @example
   * ```typescript
   * const result = ui.rerenderDirectory("journal");
   * if (!result.ok) {
   *   console.error("Failed to rerender directory");
   * }
   * ```
   */
  rerenderDirectory(
    directoryType: DirectoryType
  ): Result<boolean, UIError>;
}

/**
 * Notification severity level.
 */
export type NotificationLevel = "info" | "warning" | "error";

/**
 * Optional notification configuration.
 */
export interface NotificationOptions {
  /**
   * Whether notification should persist until manually closed.
   * Default: false (auto-dismiss after timeout)
   */
  permanent?: boolean;

  /**
   * Whether to also log to console.
   * Default: false
   */
  console?: boolean;

  /**
   * Custom CSS classes for styling.
   * Platform-specific, might be ignored.
   */
  classes?: string[];
}

/**
 * Entity type identifier.
 * 
 * Used for generic entity operations (remove, rerender, etc.)
 */
export type EntityType = "journal" | "actor" | "item" | "scene" | "cards" | "rollTable";

/**
 * Directory type identifier.
 * 
 * Maps to sidebar directories in UI-based platforms.
 */
export type DirectoryType = "journal" | "actor" | "item" | "scene" | "cards" | "rollTable";

/**
 * Platform-agnostic error for UI operations.
 */
export interface UIError {
  code: 
    | "UI_NOT_AVAILABLE"           // Platform has no UI (headless)
    | "ELEMENT_NOT_FOUND"           // HTML element not found
    | "DIRECTORY_NOT_FOUND"         // Directory not found or not supported
    | "PLATFORM_ERROR";             // Generic platform error
  message: string;
  details?: unknown;
}
```

**Erfolgskriterien:**
- ✅ Interface ist platform-agnostisch
- ✅ Keine Foundry-Typen
- ✅ Dokumentation erklärt Mapping zu verschiedenen Plattformen
- ✅ Generische Entity-Operations (kein "journal", "actor" hardcoded)
- ✅ Result-Pattern für Error-Handling
- ✅ Headless-Platform-Support (No-op möglich)

---

### Step 3: Foundry-Adapter implementieren

**Datei:** `src/infrastructure/adapters/foundry/ui-adapters/foundry-ui-adapter.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type {
  PlatformUIPort,
  NotificationLevel,
  NotificationOptions,
  EntityType,
  DirectoryType,
  UIError,
} from "@/domain/ports/platform-ui-port.interface";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";

/**
 * Foundry-specific implementation of PlatformUIPort.
 * 
 * Maps Foundry's UI system to platform-agnostic UI port.
 * 
 * @example
 * ```typescript
 * const adapter = new FoundryUIAdapter(foundryUI);
 * 
 * adapter.notify("Settings saved", "info");
 * adapter.removeEntityElement("journal", "journal-123", htmlElement);
 * ```
 */
export class FoundryUIAdapter implements PlatformUIPort {
  constructor(
    private readonly foundryUI: FoundryUI
  ) {}

  /**
   * Display notification using Foundry's ui.notifications.
   */
  notify(
    message: string,
    level: NotificationLevel,
    options?: NotificationOptions
  ): Result<void, UIError> {
    const result = this.foundryUI.notify(message, level, options);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: `Failed to display notification: ${result.error.message}`,
          details: result.error,
        },
      };
    }

    return { ok: true, value: undefined };
  }

  /**
   * Remove entity element from Foundry directory DOM.
   * 
   * Maps entity type to Foundry CSS selector.
   */
  removeEntityElement(
    entityType: EntityType,
    entityId: string,
    htmlContainer: HTMLElement
  ): Result<boolean, UIError> {
    const result = this.foundryUI.removeEntityElement(entityType, entityId, htmlContainer);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "ELEMENT_NOT_FOUND",
          message: `Failed to remove ${entityType} element: ${result.error.message}`,
          details: result.error,
        },
      };
    }

    return { ok: true, value: result.value };
  }

  /**
   * Rerender Foundry directory sidebar.
   * 
   * Maps directory type to Foundry sidebar tab.
   */
  rerenderDirectory(
    directoryType: DirectoryType
  ): Result<boolean, UIError> {
    const result = this.foundryUI.rerenderDirectory(directoryType);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "DIRECTORY_NOT_FOUND",
          message: `Failed to rerender ${directoryType} directory: ${result.error.message}`,
          details: result.error,
        },
      };
    }

    return { ok: true, value: result.value };
  }
}
```

**DI-Wrapper:**

```typescript
import { foundryUIToken } from "@/infrastructure/di/tokens/foundry-tokens";

/**
 * DI-enabled wrapper for FoundryUIAdapter.
 */
export class DIFoundryUIAdapter extends FoundryUIAdapter {
  static dependencies = [foundryUIToken] as const;

  constructor(foundryUI: FoundryUI) {
    super(foundryUI);
  }
}
```

**Erfolgskriterien:**
- ✅ Implementiert `PlatformUIPort`
- ✅ Nutzt `FoundryUI` (nicht direkt `ui.notifications`)
- ✅ Error-Handling mit Result-Pattern
- ✅ Mapping von Entity-Types zu Foundry-Selectors
- ✅ DI-Wrapper für Container-Registration

---

### Step 4: FoundryUI-Interface aktualisieren (optional)

**Datei:** `src/infrastructure/adapters/foundry/interfaces/FoundryUI.ts`

```typescript
// Sicherstellen, dass FoundryUI generische Methoden hat
import type { Result } from "@/domain/types/result";
import type { NotificationOptions } from "@/domain/ports/platform-ui-port.interface";

export interface FoundryUI {
  /**
   * Display notification.
   */
  notify(
    message: string,
    level: "info" | "warning" | "error",
    options?: NotificationOptions
  ): Result<void, Error>;

  /**
   * Remove entity element from DOM.
   * 
   * @param entityType - Entity type (journal, actor, etc.)
   * @param entityId - Entity ID
   * @param htmlContainer - Container element
   * @returns True if removed, false if not found
   */
  removeEntityElement(
    entityType: string,
    entityId: string,
    htmlContainer: HTMLElement
  ): Result<boolean, Error>;

  /**
   * Rerender directory sidebar.
   * 
   * @param directoryType - Directory type (journal, actor, etc.)
   * @returns True if rerendered, false if not found/supported
   */
  rerenderDirectory(
    directoryType: string
  ): Result<boolean, Error>;
}
```

**Falls FoundryUI derzeit noch journal-spezifische Methoden hat, diese entfernen:**

```typescript
// ❌ ENTFERNEN:
interface FoundryUI {
  rerenderJournalDirectory(): Result<...>;
  rerenderActorDirectory(): Result<...>;
  rerenderItemDirectory(): Result<...>;
}

// ✅ ERSETZEN DURCH:
interface FoundryUI {
  rerenderDirectory(directoryType: string): Result<...>;
}
```

---

### Step 5: DI-Token und Registration

**Datei:** `src/infrastructure/di/tokens/ui-tokens.ts`

```typescript
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";

export const platformUIPortToken = Symbol.for("PlatformUIPort");

export interface UIPortTokens {
  [platformUIPortToken]: PlatformUIPort;
}
```

**Datei:** `src/infrastructure/di/container.ts` (Registration)

```typescript
import { platformUIPortToken } from "./tokens/ui-tokens";
import { DIFoundryUIAdapter } from "@/infrastructure/adapters/foundry/ui-adapters/foundry-ui-adapter";

// In registerPorts() oder registerAdapters():
container.registerSingleton(
  platformUIPortToken,
  DIFoundryUIAdapter
);
```

---

### Step 6: UIChannel refactoren

**Datei:** `src/core/services/notification/channels/UIChannel.ts`

```typescript
// VORHER:
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";

class UIChannel implements NotificationChannel {
  constructor(
    private readonly foundryUI: FoundryUI,  // ❌ Infrastructure!
  ) {}

  send(notification: Notification): Result<void, Error> {
    const result = this.foundryUI.notify(
      notification.message,
      notification.level as "info" | "warning" | "error"
    );
    
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true, value: undefined };
  }
}

// NACHHER:
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";

class UIChannel implements NotificationChannel {
  constructor(
    private readonly ui: PlatformUIPort,  // ✅ Domain Port!
  ) {}

  send(notification: Notification): Result<void, Error> {
    const result = this.ui.notify(
      notification.message,
      notification.level as "info" | "warning" | "error"
    );
    
    if (!result.ok) {
      return {
        ok: false,
        error: new Error(result.error.message),
      };
    }

    return { ok: true, value: undefined };
  }
}
```

**DI-Wrapper aktualisieren:**

```typescript
import { platformUIPortToken } from "@/infrastructure/di/tokens/ui-tokens";

export class DIUIChannel extends UIChannel {
  static dependencies = [platformUIPortToken] as const;

  constructor(ui: PlatformUIPort) {
    super(ui);
  }
}
```

---

### Step 7: JournalVisibilityService refactoren

**Datei:** `src/application/services/JournalVisibilityService.ts`

```typescript
// VORHER:
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";

class JournalVisibilityService {
  constructor(
    private readonly foundryUI: FoundryUI,  // ❌ Infrastructure!
    // ...
  ) {}

  processJournalDirectory(htmlElement: HTMLElement): Result<void, Error> {
    // ...
    const result = this.foundryUI.removeEntityElement("journal", journalId, htmlElement);
    // ...
  }
}

// NACHHER:
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";

class JournalVisibilityService {
  constructor(
    private readonly ui: PlatformUIPort,  // ✅ Domain Port!
    // ...
  ) {}

  processJournalDirectory(htmlElement: HTMLElement): Result<void, Error> {
    // ...
    const result = this.ui.removeEntityElement("journal", journalId, htmlElement);
    // ...
  }
}
```

**DI-Wrapper aktualisieren:**

```typescript
import { platformUIPortToken } from "@/infrastructure/di/tokens/ui-tokens";

export class DIJournalVisibilityService extends JournalVisibilityService {
  static dependencies = [
    platformUIPortToken,
    journalCollectionPortToken,
    platformDocumentPortToken,
    notificationCenterToken,
    cacheServiceToken,
  ] as const;

  constructor(
    ui: PlatformUIPort,
    journalCollection: JournalCollectionPort,
    documentFlags: PlatformDocumentPort,
    notificationCenter: NotificationCenter,
    cache: CacheService,
  ) {
    super(ui, journalCollection, documentFlags, notificationCenter, cache);
  }
}
```

---

### Step 8: Tests erstellen

**Datei:** `src/domain/ports/__tests__/platform-ui-port.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import type { PlatformUIPort } from "../platform-ui-port.interface";

describe("PlatformUIPort (Contract Test)", () => {
  it("should define all required methods", () => {
    const mockPort: PlatformUIPort = {
      notify: vi.fn(),
      removeEntityElement: vi.fn(),
      rerenderDirectory: vi.fn(),
    };

    expect(mockPort.notify).toBeDefined();
    expect(mockPort.removeEntityElement).toBeDefined();
    expect(mockPort.rerenderDirectory).toBeDefined();
  });
});
```

**Datei:** `src/infrastructure/adapters/foundry/ui-adapters/__tests__/foundry-ui-adapter.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryUIAdapter } from "../foundry-ui-adapter";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";

describe("FoundryUIAdapter", () => {
  let mockFoundryUI: FoundryUI;
  let adapter: FoundryUIAdapter;

  beforeEach(() => {
    mockFoundryUI = {
      notify: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      removeEntityElement: vi.fn().mockReturnValue({ ok: true, value: true }),
      rerenderDirectory: vi.fn().mockReturnValue({ ok: true, value: true }),
    };

    adapter = new FoundryUIAdapter(mockFoundryUI);
  });

  describe("notify", () => {
    it("should display notification via FoundryUI", () => {
      const result = adapter.notify("Test message", "info");

      expect(result.ok).toBe(true);
      expect(mockFoundryUI.notify).toHaveBeenCalledWith("Test message", "info", undefined);
    });

    it("should handle notification errors", () => {
      vi.mocked(mockFoundryUI.notify).mockReturnValue({
        ok: false,
        error: new Error("UI not ready"),
      });

      const result = adapter.notify("Test", "info");

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("PLATFORM_ERROR");
    });
  });

  describe("removeEntityElement", () => {
    it("should remove entity element via FoundryUI", () => {
      const htmlElement = document.createElement("div");
      const result = adapter.removeEntityElement("journal", "journal-123", htmlElement);

      expect(result.ok).toBe(true);
      expect(result.value).toBe(true);
      expect(mockFoundryUI.removeEntityElement).toHaveBeenCalledWith(
        "journal",
        "journal-123",
        htmlElement
      );
    });

    it("should return false when element not found", () => {
      vi.mocked(mockFoundryUI.removeEntityElement).mockReturnValue({
        ok: true,
        value: false,
      });

      const result = adapter.removeEntityElement("journal", "journal-123", document.createElement("div"));

      expect(result.ok).toBe(true);
      expect(result.value).toBe(false);
    });
  });

  describe("rerenderDirectory", () => {
    it("should rerender directory via FoundryUI", () => {
      const result = adapter.rerenderDirectory("journal");

      expect(result.ok).toBe(true);
      expect(result.value).toBe(true);
      expect(mockFoundryUI.rerenderDirectory).toHaveBeenCalledWith("journal");
    });
  });
});
```

**Datei:** `src/core/services/notification/channels/__tests__/UIChannel.test.ts` (aktualisieren)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UIChannel } from "../UIChannel";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";

describe("UIChannel", () => {
  let mockUI: PlatformUIPort;
  let channel: UIChannel;

  beforeEach(() => {
    mockUI = {
      notify: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      removeEntityElement: vi.fn(),
      rerenderDirectory: vi.fn(),
    };

    channel = new UIChannel(mockUI);
  });

  it("should send notification via PlatformUIPort", () => {
    const notification = {
      message: "Test message",
      level: "info" as const,
      context: {},
    };

    const result = channel.send(notification);

    expect(result.ok).toBe(true);
    expect(mockUI.notify).toHaveBeenCalledWith("Test message", "info");
  });

  it("should handle UI errors", () => {
    vi.mocked(mockUI.notify).mockReturnValue({
      ok: false,
      error: {
        code: "UI_NOT_AVAILABLE",
        message: "UI not ready",
      },
    });

    const result = channel.send({
      message: "Test",
      level: "info",
      context: {},
    });

    expect(result.ok).toBe(false);
  });
});
```

---

## ✅ Checkliste

### Preparation
- [ ] Backup erstellen (`git commit -m "Before Phase 4: UI Operations Refactoring"`)
- [ ] Ordnerstruktur vorbereiten
- [ ] Dependencies überprüfen

### Domain Layer
- [ ] `PlatformUIPort` erstellt
- [ ] `NotificationOptions` definiert
- [ ] `EntityType` / `DirectoryType` definiert
- [ ] `UIError` definiert
- [ ] Dokumentation vollständig (Platform-Mappings)

### Infrastructure Layer
- [ ] `FoundryUIAdapter` erstellt
- [ ] Foundry-UI-Mapping implementiert
- [ ] Error-Handling mit Result-Pattern
- [ ] DI-Wrapper erstellt

### Application Layer
- [ ] `UIChannel` refactored (nutzt Port)
- [ ] `JournalVisibilityService` refactored (nutzt Port)
- [ ] Andere Services refactored (falls vorhanden)

### DI Container
- [ ] Token erstellt (`platformUIPortToken`)
- [ ] Adapter registriert
- [ ] Services aktualisiert (Dependencies)

### Tests
- [ ] Port-Contract-Tests geschrieben
- [ ] Adapter-Tests geschrieben
- [ ] Service-Tests aktualisiert (nutzen Port-Mocks)
- [ ] Alle Tests grün: `npm run test`

### Validation
- [ ] `npm run check:types` ✅
- [ ] `npm run check:lint` ✅
- [ ] `npm run check:format` ✅
- [ ] `npm run test` ✅
- [ ] `npm run check:all` ✅

### Documentation
- [ ] CHANGELOG.md aktualisiert (Unreleased → Changed)
- [ ] Code-Kommentare vollständig
- [ ] Commit: `refactor(ui): implement platform-agnostic UI operations`

---

## 🎯 Erfolgskriterien

Nach Abschluss dieser Phase:

- ✅ **Keine direkten FoundryUI-Abhängigkeiten** in Application/Core
- ✅ **PlatformUIPort** definiert und implementiert
- ✅ **UIChannel und Services entkoppelt** von Foundry
- ✅ **Generische Entity-Operations** (keine Duplikation)
- ✅ **Tests ohne Foundry-Globals** lauffähig
- ✅ **Alle Checks grün:** `npm run check:all`

---

## 🚨 Häufige Probleme

### Problem 1: Headless-Plattformen

```typescript
// ❌ FEHLER: UI-Operation schlägt fehl ohne UI
removeEntityElement(...): Result<...> {
  if (!hasUI) {
    return { ok: false, error: { code: "UI_NOT_AVAILABLE", ... } };  // ❌ Fehler!
  }
}
```

**Lösung:**
```typescript
// ✅ RICHTIG: No-op für Headless
removeEntityElement(...): Result<...> {
  if (!hasUI) {
    return { ok: true, value: false };  // ✅ OK, aber nicht gefunden
  }
}
```

### Problem 2: DOM-Element nicht gefunden

```typescript
// ❌ FEHLER: "Not found" als Error behandeln
removeEntityElement(...): Result<...> {
  const removed = element ? true : false;
  if (!removed) {
    return { ok: false, error: { code: "ELEMENT_NOT_FOUND", ... } };  // ❌ Falsch!
  }
}
```

**Lösung:**
```typescript
// ✅ RICHTIG: "Not found" ist OK (false)
removeEntityElement(...): Result<...> {
  const removed = element ? true : false;
  return { ok: true, value: removed };  // ✅ OK mit false
}
```

---

## 📚 Nächste Schritte

Nach Abschluss dieser Phase:

1. ✅ **Phase 5 starten:** Dokumentation & Cleanup
2. ✅ **Weitere UI-Operationen:** Dialog-System, Sheet-Rendering (optional)

**Geschätzte Zeit bis Phase 5:** 0 Tage (kann sofort starten)

---

**Status:** ⏳ Bereit zur Umsetzung  
**Review erforderlich:** Nach Step 8  
**Zeitaufwand:** 4-8 Stunden


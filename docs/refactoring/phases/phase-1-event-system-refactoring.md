# Phase 1: Event-System Refactoring

**Datum:** 2025-01-27  
**Priorität:** 🔴 HÖCHSTE  
**Geschätzter Aufwand:** 16-24 Stunden  
**Komplexität:** Hoch  
**Risiko:** Mittel  
**Dependencies:** Keine (kann sofort starten)

---

## 🎯 Ziel dieser Phase

Das Event-System von direkten Foundry-Abhängigkeiten befreien und platform-agnostisch machen durch:

1. ✅ Generischen `PlatformEventPort<T>` erstellen
2. ✅ Spezialisierten `JournalEventPort` erstellen
3. ✅ `FoundryJournalEventAdapter` implementieren
4. ✅ Use-Cases von Foundry-Hooks entkoppeln
5. ✅ Alte Hook-Klassen löschen
6. ✅ Tests ohne Foundry-Globals

---

## 📊 IST-Zustand (Probleme)

```typescript
// ❌ PROBLEM 1: Use-Cases hängen direkt von Infrastructure ab
class RenderJournalDirectoryHook {
  constructor(
    private readonly foundryHooks: FoundryHooks,  // ❌ Infrastructure!
    // ...
  ) {}
}

// ❌ PROBLEM 2: Foundry-spezifische Hook-Namen überall verstreut
class JournalCacheInvalidationHook {
  execute(): void {
    this.foundryHooks.on("createJournalEntry", ...);    // ❌ Foundry-specific
    this.foundryHooks.on("updateJournalEntry", ...);    // ❌ Foundry-specific
    this.foundryHooks.on("deleteJournalEntry", ...);    // ❌ Foundry-specific
  }
}

// ❌ PROBLEM 3: Nicht testbar ohne Foundry-Globals
// Tests müssen globalThis.Hooks mocken
```

**Konsequenzen:**
- 🔴 Keine anderen VTT-Plattformen möglich
- 🔴 Tests benötigen Foundry-Globals
- 🔴 Use-Cases kennen Foundry-Details
- 🔴 Keine klare Architektur-Grenze

---

## ✅ SOLL-Zustand (Ziel)

```typescript
// ✅ ZIEL 1: Use-Cases nutzen Domain-Ports
class InvalidateJournalCacheOnChangeUseCase {
  constructor(
    private readonly journalEvents: JournalEventPort,  // ✅ Domain Port!
    private readonly cache: CacheService,
  ) {}

  execute(): Result<void, Error> {
    this.journalEvents.onJournalCreated((event) => {
      this.invalidateCache("created", event.journalId);
    });
    // ...
  }
}

// ✅ ZIEL 2: Platform-agnostische Events
interface JournalCreatedEvent {
  journalId: string;
  timestamp: number;
}

// ✅ ZIEL 3: Tests ohne Foundry
const mockJournalEvents: JournalEventPort = {
  onJournalCreated: vi.fn(),
  // ...
};
```

**Vorteile:**
- ✅ Roll20/Fantasy Grounds in < 1 Woche portierbar
- ✅ Tests ohne Foundry-Globals
- ✅ Use-Cases kennen keine Foundry-Details
- ✅ Klare Architektur-Grenzen (Domain ↔ Infrastructure)

---

## 📋 Detaillierte Schritte

### Step 1: Ordnerstruktur erstellen

```bash
mkdir -p src/domain/ports/events
mkdir -p src/infrastructure/adapters/foundry/event-adapters
mkdir -p src/application/use-cases
```

**Erwartetes Ergebnis:**
```
src/
├─ domain/
│   └─ ports/
│       └─ events/
├─ infrastructure/
│   └─ adapters/
│       └─ foundry/
│           └─ event-adapters/
└─ application/
    └─ use-cases/
```

---

### Step 2: Generischen Basis-Port erstellen

**Datei:** `src/domain/ports/events/platform-event-port.interface.ts`

```typescript
import type { Result } from "@/domain/types/result";

/**
 * Generic port for platform event systems.
 * 
 * Platform-agnostic abstraction over event registration systems like:
 * - Foundry VTT Hooks
 * - Roll20 on:change events
 * - Fantasy Grounds event listeners
 * - File system polling
 * 
 * @template TEvent - The event type this port handles
 */
export interface PlatformEventPort<TEvent> {
  /**
   * Register a listener for platform events.
   * 
   * @param eventType - Generic event identifier
   * @param callback - Callback to execute when event fires
   * @returns Registration ID for cleanup
   */
  registerListener(
    eventType: string,
    callback: (event: TEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Unregister a previously registered listener.
   * 
   * @param registrationId - ID returned from registerListener()
   * @returns Success or error
   */
  unregisterListener(
    registrationId: EventRegistrationId
  ): Result<void, PlatformEventError>;
}

/**
 * Unique identifier for event registrations.
 * Allows cleanup of specific listeners.
 */
export type EventRegistrationId = string | number;

/**
 * Platform-agnostic event error.
 */
export interface PlatformEventError {
  code: 
    | "EVENT_REGISTRATION_FAILED" 
    | "EVENT_UNREGISTRATION_FAILED" 
    | "INVALID_EVENT_TYPE"
    | "PLATFORM_NOT_AVAILABLE";
  message: string;
  details?: unknown;
}
```

**Erfolgskriterien:**
- ✅ Interface ist generisch (`<TEvent>`)
- ✅ Keine Foundry-Typen
- ✅ Dokumentation erklärt Mapping zu verschiedenen Plattformen
- ✅ Result-Pattern für Error-Handling

---

### Step 3: Spezialisierten Journal-Event-Port erstellen

**Datei:** `src/domain/ports/events/journal-event-port.interface.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { 
  PlatformEventPort, 
  EventRegistrationId, 
  PlatformEventError 
} from "./platform-event-port.interface";

/**
 * Specialized port for journal lifecycle events.
 * 
 * Extends the generic PlatformEventPort with journal-specific operations.
 * Still platform-agnostic - works with any VTT system.
 */
export interface JournalEventPort extends PlatformEventPort<JournalEvent> {
  /**
   * Register listener for journal creation events.
   * 
   * Platform mappings:
   * - Foundry: "createJournalEntry" hook
   * - Roll20: "add:handout" event
   * - CSV: File creation in watched directory
   */
  onJournalCreated(
    callback: (event: JournalCreatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Register listener for journal update events.
   * 
   * Platform mappings:
   * - Foundry: "updateJournalEntry" hook
   * - Roll20: "change:handout" event
   * - CSV: File modification detected
   */
  onJournalUpdated(
    callback: (event: JournalUpdatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Register listener for journal deletion events.
   * 
   * Platform mappings:
   * - Foundry: "deleteJournalEntry" hook
   * - Roll20: "destroy:handout" event
   * - CSV: File deletion detected
   */
  onJournalDeleted(
    callback: (event: JournalDeletedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Register listener for journal directory UI render events.
   * 
   * NOTE: This is UI-specific and might not exist on all platforms.
   * Non-UI platforms (CSV, API) can return success without doing anything.
   * 
   * Platform mappings:
   * - Foundry: "renderJournalDirectory" hook
   * - Roll20: Sidebar tab activation event
   * - CSV: No-op (not applicable)
   */
  onJournalDirectoryRendered(
    callback: (event: JournalDirectoryRenderedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;
}

// ===== Platform-Agnostic Event Types =====

/**
 * Event fired when a journal entry is created.
 */
export interface JournalCreatedEvent {
  journalId: string;
  timestamp: number;
}

/**
 * Event fired when a journal entry is updated.
 */
export interface JournalUpdatedEvent {
  journalId: string;
  changes: JournalChanges;
  timestamp: number;
}

/**
 * Event fired when a journal entry is deleted.
 */
export interface JournalDeletedEvent {
  journalId: string;
  timestamp: number;
}

/**
 * Event fired when the journal directory UI is rendered.
 * Only applicable for platforms with UI.
 */
export interface JournalDirectoryRenderedEvent {
  htmlElement: HTMLElement;  // DOM ist überall gleich
  timestamp: number;
}

/**
 * Changes detected in a journal update event.
 */
export interface JournalChanges {
  flags?: Record<string, unknown>;
  name?: string;
  [key: string]: unknown;
}

/**
 * Union type of all journal events.
 */
export type JournalEvent = 
  | JournalCreatedEvent 
  | JournalUpdatedEvent 
  | JournalDeletedEvent 
  | JournalDirectoryRenderedEvent;
```

**Erfolgskriterien:**
- ✅ Erweitert `PlatformEventPort<JournalEvent>`
- ✅ Spezialisierte Methoden für Journal-Events
- ✅ Dokumentation zeigt Platform-Mappings
- ✅ Event-Types sind platform-agnostisch
- ✅ Keine Foundry-Typen

---

### Step 4: Foundry-Adapter implementieren

**Datei:** `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type {
  JournalEventPort,
  JournalCreatedEvent,
  JournalUpdatedEvent,
  JournalDeletedEvent,
  JournalDirectoryRenderedEvent,
  JournalEvent,
  JournalChanges,
} from "@/domain/ports/events/journal-event-port.interface";
import type {
  EventRegistrationId,
  PlatformEventError,
} from "@/domain/ports/events/platform-event-port.interface";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/infrastructure/adapters/foundry/types";

/**
 * Foundry-specific implementation of JournalEventPort.
 * 
 * Maps Foundry's Hook system to platform-agnostic journal events.
 * 
 * @example
 * ```typescript
 * const adapter = new FoundryJournalEventAdapter(foundryHooks);
 * 
 * adapter.onJournalCreated((event) => {
 *   console.log(`Journal created: ${event.journalId}`);
 * });
 * ```
 */
export class FoundryJournalEventAdapter implements JournalEventPort {
  private registrations = new Map<EventRegistrationId, () => void>();
  private nextId = 1;

  constructor(
    private readonly foundryHooks: FoundryHooks,
  ) {}

  // ===== Specialized Journal Methods =====

  onJournalCreated(
    callback: (event: JournalCreatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "createJournalEntry",  // Foundry-spezifischer Hook-Name
      (foundryEntry: unknown, options: unknown, userId: string) => {
        // Mapping: Foundry-Event → Domain-Event
        const event: JournalCreatedEvent = {
          journalId: this.extractId(foundryEntry),
          timestamp: Date.now(),
        };
        callback(event);
      }
    );
  }

  onJournalUpdated(
    callback: (event: JournalUpdatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "updateJournalEntry",  // Foundry-spezifisch
      (foundryEntry: unknown, changes: unknown, options: unknown, userId: string) => {
        const event: JournalUpdatedEvent = {
          journalId: this.extractId(foundryEntry),
          changes: this.normalizeChanges(changes),
          timestamp: Date.now(),
        };
        callback(event);
      }
    );
  }

  onJournalDeleted(
    callback: (event: JournalDeletedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "deleteJournalEntry",
      (foundryEntry: unknown, options: unknown, userId: string) => {
        const event: JournalDeletedEvent = {
          journalId: this.extractId(foundryEntry),
          timestamp: Date.now(),
        };
        callback(event);
      }
    );
  }

  onJournalDirectoryRendered(
    callback: (event: JournalDirectoryRenderedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "renderJournalDirectory",
      (app: unknown, html: unknown) => {
        const htmlElement = this.extractHtmlElement(html);
        if (!htmlElement) return;

        const event: JournalDirectoryRenderedEvent = {
          htmlElement,
          timestamp: Date.now(),
        };
        callback(event);
      }
    );
  }

  // ===== Generic Methods (from PlatformEventPort) =====

  registerListener(
    eventType: string,
    callback: (event: JournalEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Fallback für generische registerListener
    // In der Praxis sollten die spezialisierten Methoden genutzt werden
    return this.registerFoundryHook(eventType, callback as FoundryHookCallback);
  }

  unregisterListener(
    registrationId: EventRegistrationId
  ): Result<void, PlatformEventError> {
    const cleanup = this.registrations.get(registrationId);
    if (!cleanup) {
      return {
        ok: false,
        error: {
          code: "EVENT_UNREGISTRATION_FAILED",
          message: `No registration found for ID ${registrationId}`,
        },
      };
    }

    cleanup();
    this.registrations.delete(registrationId);
    return { ok: true, value: undefined };
  }

  // ===== Lifecycle =====

  /**
   * Cleanup all registered listeners.
   * Should be called during module shutdown.
   */
  dispose(): void {
    for (const cleanup of this.registrations.values()) {
      cleanup();
    }
    this.registrations.clear();
  }

  // ===== Private Helpers =====

  private registerFoundryHook(
    hookName: string,
    callback: FoundryHookCallback
  ): Result<EventRegistrationId, PlatformEventError> {
    const result = this.foundryHooks.on(hookName, callback);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "EVENT_REGISTRATION_FAILED",
          message: `Failed to register Foundry hook "${hookName}": ${result.error.message}`,
          details: result.error,
        },
      };
    }

    const foundryHookId = result.value;
    const registrationId = String(this.nextId++);

    // Store cleanup function
    this.registrations.set(registrationId, () => {
      this.foundryHooks.off(hookName, foundryHookId);
    });

    return { ok: true, value: registrationId };
  }

  private extractId(foundryEntry: unknown): string {
    return (foundryEntry as { id: string }).id;
  }

  private normalizeChanges(foundryChanges: unknown): JournalChanges {
    const changes = foundryChanges as Record<string, unknown>;
    return {
      flags: changes.flags as Record<string, unknown> | undefined,
      name: changes.name as string | undefined,
      ...changes,
    };
  }

  private extractHtmlElement(html: unknown): HTMLElement | null {
    if (html instanceof HTMLElement) return html;
    if (Array.isArray(html) && html[0] instanceof HTMLElement) return html[0];
    return null;
  }
}
```

**Erfolgskriterien:**
- ✅ Implementiert `JournalEventPort`
- ✅ Nutzt `FoundryHooks` (nicht direkt `Hooks`)
- ✅ Mapping von Foundry-Events zu Domain-Events
- ✅ Registration-ID-Tracking für Cleanup
- ✅ Error-Handling mit Result-Pattern
- ✅ `dispose()` für Lifecycle-Management

---

### Step 5: DI-Token und Registration

**Datei:** `src/infrastructure/di/tokens/event-tokens.ts`

```typescript
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";

export const journalEventPortToken = Symbol.for("JournalEventPort");

export interface EventPortTokens {
  [journalEventPortToken]: JournalEventPort;
}
```

**Datei:** `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts` (DI-Wrapper hinzufügen)

```typescript
// ... existing code ...

import { foundryHooksToken } from "@/infrastructure/di/tokens/foundry-tokens";

/**
 * DI-enabled wrapper for FoundryJournalEventAdapter.
 */
export class DIFoundryJournalEventAdapter extends FoundryJournalEventAdapter {
  static dependencies = [foundryHooksToken] as const;

  constructor(hooks: FoundryHooks) {
    super(hooks);
  }
}
```

**Datei:** `src/infrastructure/di/container.ts` (Registration)

```typescript
import { journalEventPortToken } from "./tokens/event-tokens";
import { DIFoundryJournalEventAdapter } from "@/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter";

// In registerPorts() oder registerAdapters():
container.registerSingleton(
  journalEventPortToken,
  DIFoundryJournalEventAdapter
);
```

---

### Step 6: Use-Case erstellen (Cache-Invalidation)

**Datei:** `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { CacheService } from "@/core/services/cache/CacheService";
import type { NotificationCenter } from "@/core/services/notification/NotificationCenter";

/**
 * Use-Case: Invalidate journal cache when journal entries change.
 * 
 * Platform-agnostic - works with any JournalEventPort implementation.
 * 
 * @example
 * ```typescript
 * const useCase = new InvalidateJournalCacheOnChangeUseCase(
 *   journalEventPort,
 *   cacheService,
 *   notificationCenter
 * );
 * 
 * useCase.execute();  // Start listening
 * useCase.dispose();  // Stop listening
 * ```
 */
export class InvalidateJournalCacheOnChangeUseCase {
  private registrationIds: EventRegistrationId[] = [];

  constructor(
    private readonly journalEvents: JournalEventPort,
    private readonly cache: CacheService,
    private readonly notificationCenter: NotificationCenter,
  ) {}

  /**
   * Execute use-case: Register listeners for journal change events.
   */
  execute(): Result<void, Error> {
    // Register for all journal change events
    const results = [
      this.journalEvents.onJournalCreated((event) => {
        this.invalidateCache("created", event.journalId);
      }),
      this.journalEvents.onJournalUpdated((event) => {
        this.invalidateCache("updated", event.journalId);
        
        // Check if hidden flag changed
        if (event.changes.flags?.["hidden"] !== undefined) {
          this.triggerUIUpdate(event.journalId);
        }
      }),
      this.journalEvents.onJournalDeleted((event) => {
        this.invalidateCache("deleted", event.journalId);
      }),
    ];

    // Collect registration IDs for cleanup
    for (const result of results) {
      if (result.ok) {
        this.registrationIds.push(result.value);
      } else {
        this.notificationCenter.error(
          "Failed to register journal event listener",
          result.error,
          { channels: ["ConsoleChannel"] }
        );
      }
    }

    return { ok: true, value: undefined };
  }

  /**
   * Invalidate cache entries related to journals.
   */
  private invalidateCache(reason: string, journalId: string): void {
    const removed = this.cache.invalidateWhere(meta =>
      meta.tags.includes("journal:hidden")
    );
    
    if (removed > 0) {
      this.notificationCenter.debug(
        `Invalidated ${removed} journal cache entries (${reason})`,
        { journalId },
        { channels: ["ConsoleChannel"] }
      );
    }
  }

  /**
   * Trigger UI update when journal visibility changes.
   */
  private triggerUIUpdate(journalId: string): void {
    this.notificationCenter.debug(
      "Journal hidden flag changed, UI update needed",
      { journalId },
      { channels: ["ConsoleChannel"] }
    );
  }

  /**
   * Cleanup: Unregister all event listeners.
   */
  dispose(): void {
    for (const id of this.registrationIds) {
      this.journalEvents.unregisterListener(id);
    }
    this.registrationIds = [];
  }
}
```

**DI-Wrapper:**

```typescript
import { journalEventPortToken } from "@/infrastructure/di/tokens/event-tokens";
import { cacheServiceToken } from "@/infrastructure/di/tokens/service-tokens";
import { notificationCenterToken } from "@/infrastructure/di/tokens/notification-tokens";

export class DIInvalidateJournalCacheOnChangeUseCase extends InvalidateJournalCacheOnChangeUseCase {
  static dependencies = [
    journalEventPortToken,
    cacheServiceToken,
    notificationCenterToken,
  ] as const;

  constructor(
    journalEvents: JournalEventPort,
    cache: CacheService,
    notificationCenter: NotificationCenter,
  ) {
    super(journalEvents, cache, notificationCenter);
  }
}
```

---

### Step 7: Use-Case erstellen (Directory Render)

**Datei:** `src/application/use-cases/process-journal-directory-on-render.use-case.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { NotificationCenter } from "@/core/services/notification/NotificationCenter";

/**
 * Use-Case: Process journal directory when it's rendered.
 * 
 * Platform-agnostic - works with any JournalEventPort implementation.
 */
export class ProcessJournalDirectoryOnRenderUseCase {
  private registrationId?: EventRegistrationId;

  constructor(
    private readonly journalEvents: JournalEventPort,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly notificationCenter: NotificationCenter,
  ) {}

  /**
   * Execute use-case: Register listener for directory render events.
   */
  execute(): Result<void, Error> {
    const result = this.journalEvents.onJournalDirectoryRendered((event) => {
      this.notificationCenter.debug(
        "Journal directory rendered, processing visibility",
        { timestamp: event.timestamp },
        { channels: ["ConsoleChannel"] }
      );

      const processResult = this.journalVisibility.processJournalDirectory(
        event.htmlElement
      );

      if (!processResult.ok) {
        this.notificationCenter.error(
          "Failed to process journal directory",
          processResult.error,
          { channels: ["ConsoleChannel"] }
        );
      }
    });

    if (result.ok) {
      this.registrationId = result.value;
    }

    return result.ok
      ? { ok: true, value: undefined }
      : { ok: false, error: new Error(result.error.message) };
  }

  /**
   * Cleanup: Unregister event listener.
   */
  dispose(): void {
    if (this.registrationId) {
      this.journalEvents.unregisterListener(this.registrationId);
      this.registrationId = undefined;
    }
  }
}
```

**DI-Wrapper:**

```typescript
export class DIProcessJournalDirectoryOnRenderUseCase extends ProcessJournalDirectoryOnRenderUseCase {
  static dependencies = [
    journalEventPortToken,
    journalVisibilityServiceToken,
    notificationCenterToken,
  ] as const;

  constructor(
    journalEvents: JournalEventPort,
    journalVisibility: JournalVisibilityService,
    notificationCenter: NotificationCenter,
  ) {
    super(journalEvents, journalVisibility, notificationCenter);
  }
}
```

---

### Step 8: ModuleHookRegistrar aktualisieren

**Datei:** `src/application/services/ModuleHookRegistrar.ts`

```typescript
// VORHER:
class ModuleHookRegistrar {
  constructor(
    private readonly renderJournalDirectoryHook: RenderJournalDirectoryHook,
    private readonly journalCacheInvalidationHook: JournalCacheInvalidationHook,
  ) {}

  registerAllHooks(): Result<void, Error> {
    this.renderJournalDirectoryHook.execute();
    this.journalCacheInvalidationHook.execute();
  }
}

// NACHHER:
class ModuleHookRegistrar {
  constructor(
    private readonly processJournalDirectoryOnRender: ProcessJournalDirectoryOnRenderUseCase,
    private readonly invalidateJournalCacheOnChange: InvalidateJournalCacheOnChangeUseCase,
  ) {}

  registerAllHooks(): Result<void, Error> {
    const result1 = this.processJournalDirectoryOnRender.execute();
    const result2 = this.invalidateJournalCacheOnChange.execute();

    // Error handling...
    return { ok: true, value: undefined };
  }

  dispose(): void {
    this.processJournalDirectoryOnRender.dispose();
    this.invalidateJournalCacheOnChange.dispose();
  }
}
```

---

### Step 9: Alte Hook-Klassen löschen

**Zu löschende Dateien:**
- `src/application/hooks/RenderJournalDirectoryHook.ts`
- `src/application/hooks/JournalCacheInvalidationHook.ts`
- Alle Tests für diese Hooks

**Warum?**
- ✅ Ersetzt durch Use-Cases
- ✅ Keine direkte Foundry-Abhängigkeit mehr
- ✅ Bessere Benennung (Use-Case statt Hook)

---

### Step 10: Tests erstellen

**Datei:** `src/domain/ports/events/__tests__/journal-event-port.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import type { JournalEventPort } from "../journal-event-port.interface";

describe("JournalEventPort (Contract Test)", () => {
  it("should define all required methods", () => {
    const mockPort: JournalEventPort = {
      onJournalCreated: vi.fn(),
      onJournalUpdated: vi.fn(),
      onJournalDeleted: vi.fn(),
      onJournalDirectoryRendered: vi.fn(),
      registerListener: vi.fn(),
      unregisterListener: vi.fn(),
    };

    expect(mockPort.onJournalCreated).toBeDefined();
    expect(mockPort.onJournalUpdated).toBeDefined();
    expect(mockPort.onJournalDeleted).toBeDefined();
    expect(mockPort.onJournalDirectoryRendered).toBeDefined();
  });
});
```

**Datei:** `src/infrastructure/adapters/foundry/event-adapters/__tests__/foundry-journal-event-adapter.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryJournalEventAdapter } from "../foundry-journal-event-adapter";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";

describe("FoundryJournalEventAdapter", () => {
  let mockFoundryHooks: FoundryHooks;
  let adapter: FoundryJournalEventAdapter;

  beforeEach(() => {
    mockFoundryHooks = {
      on: vi.fn().mockReturnValue({ ok: true, value: 123 }),
      off: vi.fn().mockReturnValue({ ok: true, value: undefined }),
    };

    adapter = new FoundryJournalEventAdapter(mockFoundryHooks);
  });

  describe("onJournalCreated", () => {
    it("should register createJournalEntry hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);

      expect(result.ok).toBe(true);
      expect(mockFoundryHooks.on).toHaveBeenCalledWith(
        "createJournalEntry",
        expect.any(Function)
      );
    });

    it("should map Foundry event to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalCreated(callback);

      // Simulate Foundry hook callback
      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0][1];
      foundryCallback({ id: "journal-123" }, {}, "user-456");

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-123",
        timestamp: expect.any(Number),
      });
    });
  });

  describe("unregisterListener", () => {
    it("should cleanup Foundry hook", () => {
      const result = adapter.onJournalCreated(vi.fn());
      expect(result.ok).toBe(true);

      const registrationId = result.value;
      const unregisterResult = adapter.unregisterListener(registrationId);

      expect(unregisterResult.ok).toBe(true);
      expect(mockFoundryHooks.off).toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should cleanup all registrations", () => {
      adapter.onJournalCreated(vi.fn());
      adapter.onJournalUpdated(vi.fn());

      adapter.dispose();

      expect(mockFoundryHooks.off).toHaveBeenCalledTimes(2);
    });
  });
});
```

**Datei:** `src/application/use-cases/__tests__/invalidate-journal-cache-on-change.use-case.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvalidateJournalCacheOnChangeUseCase } from "../invalidate-journal-cache-on-change.use-case";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";

describe("InvalidateJournalCacheOnChangeUseCase", () => {
  let mockJournalEvents: JournalEventPort;
  let mockCache: any;
  let mockNotificationCenter: any;
  let useCase: InvalidateJournalCacheOnChangeUseCase;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalCreated: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      onJournalUpdated: vi.fn().mockReturnValue({ ok: true, value: "2" }),
      onJournalDeleted: vi.fn().mockReturnValue({ ok: true, value: "3" }),
      onJournalDirectoryRendered: vi.fn(),
      registerListener: vi.fn(),
      unregisterListener: vi.fn(),
    };

    mockCache = {
      invalidateWhere: vi.fn().mockReturnValue(5),
    };

    mockNotificationCenter = {
      debug: vi.fn(),
      error: vi.fn(),
    };

    useCase = new InvalidateJournalCacheOnChangeUseCase(
      mockJournalEvents,
      mockCache,
      mockNotificationCenter
    );
  });

  it("should register all journal event listeners", () => {
    useCase.execute();

    expect(mockJournalEvents.onJournalCreated).toHaveBeenCalled();
    expect(mockJournalEvents.onJournalUpdated).toHaveBeenCalled();
    expect(mockJournalEvents.onJournalDeleted).toHaveBeenCalled();
  });

  it("should invalidate cache when journal is created", () => {
    useCase.execute();

    const callback = vi.mocked(mockJournalEvents.onJournalCreated).mock.calls[0][0];
    callback({ journalId: "journal-123", timestamp: Date.now() });

    expect(mockCache.invalidateWhere).toHaveBeenCalled();
  });

  it("should cleanup listeners on dispose", () => {
    useCase.execute();
    useCase.dispose();

    expect(mockJournalEvents.unregisterListener).toHaveBeenCalledTimes(3);
  });
});
```

---

## ✅ Checkliste

### Preparation
- [ ] Backup erstellen (`git commit -m "Before Phase 1: Event System Refactoring"`)
- [ ] Ordnerstruktur erstellen
- [ ] Dependencies überprüfen (`Result`, `FoundryHooks`, etc.)

### Domain Layer
- [ ] `PlatformEventPort<T>` erstellt
- [ ] `JournalEventPort` erstellt
- [ ] Event-Types definiert (`JournalCreatedEvent`, etc.)
- [ ] Dokumentation vollständig (Platform-Mappings)

### Infrastructure Layer
- [ ] `FoundryJournalEventAdapter` erstellt
- [ ] Foundry-Hook-Mapping implementiert
- [ ] Registration-Tracking implementiert
- [ ] `dispose()` für Cleanup implementiert
- [ ] DI-Wrapper erstellt

### Application Layer
- [ ] `InvalidateJournalCacheOnChangeUseCase` erstellt
- [ ] `ProcessJournalDirectoryOnRenderUseCase` erstellt
- [ ] `ModuleHookRegistrar` aktualisiert
- [ ] Alte Hook-Klassen gelöscht

### DI Container
- [ ] Tokens erstellt (`journalEventPortToken`)
- [ ] Adapter registriert
- [ ] Use-Cases registriert
- [ ] Dependencies aufgelöst

### Tests
- [ ] Port-Contract-Tests geschrieben
- [ ] Adapter-Tests geschrieben (kein Foundry-Global)
- [ ] Use-Case-Tests geschrieben
- [ ] Alle Tests grün: `npm run test`

### Validation
- [ ] `npm run check:types` ✅
- [ ] `npm run check:lint` ✅
- [ ] `npm run check:format` ✅
- [ ] `npm run test` ✅
- [ ] `npm run check:all` ✅

### Documentation
- [ ] CHANGELOG.md aktualisiert (Unreleased → Added)
- [ ] Code-Kommentare vollständig
- [ ] Commit: `refactor(events): implement platform-agnostic event system`

---

## 🎯 Erfolgskriterien

Nach Abschluss dieser Phase:

- ✅ **Keine direkten Foundry-Hook-Zugriffe** in Application-Layer
- ✅ **JournalEventPort** definiert und implementiert
- ✅ **Use-Cases entkoppelt** von Foundry
- ✅ **Tests ohne Foundry-Globals** lauffähig
- ✅ **Platform-agnostisch:** Roll20-Adapter theoretisch in < 1 Tag implementierbar
- ✅ **Alle Checks grün:** `npm run check:all`

---

## 🚨 Häufige Probleme

### Problem 1: TypeScript-Fehler bei Generic-Port

```typescript
// ❌ FEHLER
interface JournalEventPort extends PlatformEventPort<JournalEvent> {
  onJournalCreated(callback: (event: JournalCreatedEvent) => void): Result<...>;
}
// Error: JournalCreatedEvent ist nicht JournalEvent zuweisbar
```

**Lösung:**
```typescript
// ✅ RICHTIG
export type JournalEvent = 
  | JournalCreatedEvent 
  | JournalUpdatedEvent 
  | JournalDeletedEvent 
  | JournalDirectoryRenderedEvent;
```

### Problem 2: Hook-Callback-Parameter

```typescript
// ❌ FEHLER: Foundry Hook hat unterschiedliche Parameter
this.foundryHooks.on("createJournalEntry", (entry) => {
  // entry hat keine bekannten Properties
});
```

**Lösung:**
```typescript
// ✅ RICHTIG: Type-Assertion mit Helper
this.foundryHooks.on("createJournalEntry", (entry: unknown) => {
  const id = this.extractId(entry);  // Helper-Methode
});
```

### Problem 3: Cleanup vergessen

```typescript
// ❌ FEHLER: Memory Leak - Listeners werden nicht entfernt
useCase.execute();
// Module wird deaktiviert → Listeners bleiben registriert
```

**Lösung:**
```typescript
// ✅ RICHTIG: Dispose-Pattern
class ModuleHookRegistrar {
  dispose(): void {
    this.processJournalDirectoryOnRender.dispose();
    this.invalidateJournalCacheOnChange.dispose();
  }
}
```

---

## 📚 Nächste Schritte

Nach Abschluss dieser Phase:

1. ✅ **Phase 2 starten:** Entity-Collections Refactoring
2. ✅ **Actor-Events erweitern:** `ActorEventPort` nach gleichem Muster
3. ✅ **Item-Events erweitern:** `ItemEventPort` nach gleichem Muster

**Geschätzte Zeit bis Phase 2:** 0 Tage (parallel möglich)

---

**Status:** ⏳ Bereit zur Umsetzung  
**Review erforderlich:** Nach Step 10  
**Zeitaufwand:** 16-24 Stunden


# Context-Menü Custom Entry Implementation

**Erstellt:** 2025-01-27  
**Status:** ✅ **ABGESCHLOSSEN in v0.29.0 (2025-11-23)**  
**Priorität:** 🟡 Mittel  
**Aufwand:** ✅ Abgeschlossen  
**Archiviert:** 2025-11-23  

---

## 📋 Problem

Der aktuelle Ansatz für das Context-Menü "Journal ausblenden" funktioniert nicht:

1. **Hook `getJournalEntryContext` wird nicht aufgerufen**
   - Foundry VTT v13 nutzt diesen Hook nicht mehr
   - Der Hook wird zwar registriert, aber nie gefeuert
   - Alternative Hook `getJournalEntryContextOptions` existiert, wird aber ebenfalls nicht aufgerufen

2. **Aktuelle Implementierung nutzt nicht-existierenden Hook**
   - `RegisterJournalContextMenuUseCase` nutzt `onJournalContextMenu()`
   - Diese Methode registriert `getJournalEntryContext` Hook
   - Hook wird nie aufgerufen → MenuItem erscheint nie

3. **Foundry's ContextMenu-System**
   - ContextMenu wird erst beim Rechtsklick erstellt (nicht beim Render)
   - ContextMenu hat `menuItems` Array, das direkt modifiziert werden kann
   - `ContextMenu.prototype.render` kann überschrieben werden

---

## 🔍 Erkenntnisse aus Debugging

### Hook-System
- **Hook `getJournalEntryContext`**: Existiert, wird aber nie aufgerufen
- **Hook `getJournalEntryContextOptions`**: Existiert, wird aber nie aufgerufen
- **Hook `renderJournalDirectory`**: ✅ Funktioniert, wird aufgerufen
- **Kein Hook für ContextMenu-Render**: Foundry nutzt kein Hook-System für ContextMenu

### ContextMenu-Struktur
- **Klasse**: `ContextMenu` (deprecated) oder `foundry.applications.ux.ContextMenu.implementation` (v13+)
- **MenuItems**: `this.menuItems` Array mit `{name, icon, condition, callback}`
- **Render-Methode**: `ContextMenu.prototype.render(target, options)`
- **Verfügbarkeit**: ContextMenu ist im `ready`-Hook bereits definiert

### Timing
- **ContextMenu wird erstellt**: Beim Rechtsklick (nicht beim Render)
- **renderJournalDirectory Hook**: Wird beim Render aufgerufen
- **ready Hook**: Foundry ist vollständig geladen, alle Services verfügbar

---

## ✅ Lösung

### Ansatz: Event-Port-Pattern + Handler-Registry (erweiterbar)

**Architektur-Hierarchie:**
```
Application Layer
  ├─ RegisterJournalContextMenuUseCase (Orchestrator)
  │   ↓ depends on
  │   JournalEventPort (Domain Layer - platform-agnostic)
  │   ↓ depends on
  │   JournalContextMenuHandler[] (Handler-Interface)
  │
  └─ Handler-Implementierungen
      ├─ HideJournalContextMenuHandler (spezifisch)
      ├─ ShowJournalContextMenuHandler (spezifisch)
      └─ ... weitere Handler (erweiterbar)
```

**Warum Handler-Pattern?**
- ✅ **Erweiterbar** - Neue Context-Menü-Items = neuer Handler
- ✅ **Separation of Concerns** - Jeder Handler hat eine klare Verantwortung
- ✅ **Testbarkeit** - Handler einzeln testbar
- ✅ **Wiederverwendbar** - Handler können in anderen Kontexten genutzt werden
- ✅ **Event-Port bleibt generisch** - Unterstützt bereits mehrere Callbacks

**Warum Event-Port-Pattern?**
- ✅ **Folgt etabliertem Pattern** (wie `onJournalDirectoryRendered`)
- ✅ **Platform-agnostic** - Use-Case kennt keine Foundry-Details
- ✅ **Bestehende Infrastruktur** - `JournalEventPort.onJournalContextMenu()` existiert bereits
- ✅ **Konsistenz** - Alle Journal-Events nutzen denselben Port

**Unterschied zum alten Ansatz:**
- ❌ **Alt**: `FoundryContextMenu` Service (Foundry-spezifisch)
- ✅ **Neu**: `JournalEventPort.onJournalContextMenu()` + Handler-Interface (platform-agnostic, erweiterbar)
- ✅ **Implementierung**: `FoundryJournalEventAdapter` nutzt libWrapper intern (statt Hook)

### Implementierung

1. **lib-wrapper als Dependency hinzufügen** (`module.json`)
2. **FoundryJournalEventAdapter erweitern** - `onJournalContextMenu()` nutzt libWrapper statt Hook
3. **Handler-Interface definieren** - `JournalContextMenuHandler` für erweiterbare Items
4. **Handler-Implementierungen** - `HideJournalContextMenuHandler` (und weitere)
5. **Use-Case als Orchestrator** - Registriert alle Handler beim Event-Port
6. **Keine neuen Interfaces/Services nötig** - Nutzt bestehende `JournalEventPort` Infrastruktur

---

## 🔧 Technische Details

### 1. module.json - lib-wrapper Dependency

```json
{
  "relationships": {
    "requires": [
      {
        "id": "lib-wrapper",
        "type": "module",
        "manifest": "https://github.com/ruipin/fvtt-lib-wrapper/releases/latest/download/module.json",
        "compatibility": {
          "minimum": "1.0.0.0",
          "verified": "1.12.6.0"
        }
      }
    ]
  }
}
```

### 2. FoundryJournalEventAdapter erweitern - libWrapper statt Hook

**Datei:** `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts`

**Änderung:** Die bestehende `onJournalContextMenu()` Methode nutzt aktuell den Hook `getJournalEntryContext`, der nicht funktioniert. Wir ersetzen die Implementierung, um libWrapper zu nutzen:

```typescript
// ... existing imports ...
import { tryCatch } from "@/infrastructure/shared/utils/result";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";

export class FoundryJournalEventAdapter implements JournalEventPort {
  // ... existing code ...
  
  private libWrapperRegistered = false;
  private contextMenuCallbacks: Array<(event: JournalContextMenuEvent) => void> = [];

  onJournalContextMenu(
    callback: (event: JournalContextMenuEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Prüfe libWrapper Verfügbarkeit
    if (typeof libWrapper === "undefined") {
      return {
        ok: false,
        error: {
          code: "API_NOT_AVAILABLE",
          message: "libWrapper is not available",
        },
      };
    }

    // Prüfe ContextMenu Verfügbarkeit
    const ContextMenuClass =
      foundry?.applications?.ux?.ContextMenu?.implementation || ContextMenu;
    if (!ContextMenuClass) {
      return {
        ok: false,
        error: {
          code: "API_NOT_AVAILABLE",
          message: "ContextMenu is not available",
        },
      };
    }

    // Registriere Callback
    this.contextMenuCallbacks.push(callback);
    const registrationId = String(this.nextId++);

    // Registriere libWrapper nur einmal (für alle Callbacks)
    if (!this.libWrapperRegistered) {
      // Closure für Callbacks-Array (damit libWrapper-Wrapper darauf zugreifen kann)
      const callbacksRef = this.contextMenuCallbacks;
      const result = tryCatch(
        () => {
          libWrapper.register(
            MODULE_CONSTANTS.MODULE.ID,
            "ContextMenu.prototype.render",
            function (target: HTMLElement, options = {}) {
              // `this` ist hier das ContextMenu-Objekt
              if (!this.menuItems) {
                return libWrapper.callOriginal(this, target, options);
              }

              // Prüfe, ob es ein Journal-Eintrag ist
              const journalId =
                target.getAttribute?.("data-entry-id") ||
                target.getAttribute?.("data-document-id");

              if (journalId) {
                // Erstelle Event-Objekt (wie im Hook-Pattern)
                const event: JournalContextMenuEvent = {
                  htmlElement: target,
                  options: this.menuItems.map((item) => ({
                    name: item.name,
                    icon: item.icon,
                    callback: item.callback,
                  })),
                  timestamp: Date.now(),
                };

                // Rufe alle registrierten Callbacks auf (via Closure)
                for (const cb of callbacksRef) {
                  cb(event);
                }
              }

              return libWrapper.callOriginal(this, target, options);
            },
            "WRAPPER"
          );
          this.libWrapperRegistered = true;
        },
        (error) => ({
          code: "OPERATION_FAILED",
          message: `Failed to register libWrapper: ${String(error)}`,
        })
      );

      if (!result.ok) {
        // Rollback: Entferne Callback
        this.contextMenuCallbacks.pop();
        return {
          ok: false,
          error: result.error,
        };
      }
    }

    // Store cleanup function
    this.registrations.set(registrationId, () => {
      // Entferne Callback
      const index = this.contextMenuCallbacks.indexOf(callback);
      if (index > -1) {
        this.contextMenuCallbacks.splice(index, 1);
      }

      // Wenn keine Callbacks mehr, unregister libWrapper
      if (this.contextMenuCallbacks.length === 0 && this.libWrapperRegistered) {
        tryCatch(
          () => {
            libWrapper.unregister(MODULE_CONSTANTS.MODULE.ID, "ContextMenu.prototype.render");
            this.libWrapperRegistered = false;
          },
          (error) => {
            console.error("Failed to unregister libWrapper:", error);
          }
        );
      }
    });

    return { ok: true, value: registrationId };
  }

  // ... rest of existing code ...
}
```

**Wichtig:**
- libWrapper wird nur **einmal** registriert (für alle Callbacks)
- Jeder Callback erhält das Event mit `options` Array (mutable)
- Cleanup entfernt Callback und unregistert libWrapper, wenn keine Callbacks mehr vorhanden

### 3. Handler-Interface definieren

**Datei:** `src/application/handlers/journal-context-menu-handler.interface.ts`

```typescript
import type { JournalContextMenuEvent } from "@/domain/ports/events/journal-event-port.interface";

/**
 * Handler interface for journal context menu customization.
 * Allows multiple handlers to be registered for the same event.
 *
 * @example
 * ```typescript
 * class HideJournalHandler implements JournalContextMenuHandler {
 *   handle(event: JournalContextMenuEvent): void {
 *     // Add "Journal ausblenden" menu item
 *   }
 * }
 * ```
 */
export interface JournalContextMenuHandler {
  /**
   * Handle context menu event by potentially adding menu items.
   * The event.options array is mutable and can be modified.
   *
   * @param event - The context menu event with mutable options array
   */
  handle(event: JournalContextMenuEvent): void;
}
```

### 4. Handler-Implementierung: HideJournalContextMenuHandler

**Datei:** `src/application/handlers/hide-journal-context-menu-handler.ts`

```typescript
import type { JournalContextMenuHandler } from "./journal-context-menu-handler.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/journal-event-port.interface";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { PlatformUI } from "@/infrastructure/platform/interfaces/PlatformUI";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";

/**
 * Handler that adds "Journal ausblenden" menu item to journal context menus.
 */
export class HideJournalContextMenuHandler implements JournalContextMenuHandler {
  constructor(
    private readonly journalVisibility: JournalVisibilityService,
    private readonly platformUI: PlatformUI,
    private readonly notificationCenter: NotificationCenter
  ) {}

  handle(event: JournalContextMenuEvent): void {
    // Extrahiere Journal-ID aus HTML-Element
    const journalId =
      event.htmlElement.getAttribute?.("data-entry-id") ||
      event.htmlElement.getAttribute?.("data-document-id");

    if (!journalId) {
      return; // Kein Journal-Eintrag
    }

    // Prüfe, ob unser MenuItem bereits existiert
    const existingItem = event.options.find(
      (item) => item.name === "Journal ausblenden"
    );

    if (existingItem) {
      return; // Bereits hinzugefügt
    }

    // Prüfe, ob Journal bereits versteckt ist
    const flagResult = this.journalVisibility.getEntryFlag(
      { id: journalId, name: null },
      MODULE_CONSTANTS.FLAGS.HIDDEN
    );

    // Nur hinzufügen, wenn nicht versteckt
    if (flagResult.ok && flagResult.value !== true) {
      event.options.push({
        name: "Journal ausblenden",
        icon: '<i class="fas fa-eye-slash"></i>',
        callback: async (li: HTMLElement) => {
          // Journal verstecken
          const hideResult = await this.journalVisibility.setEntryFlag(
            { id: journalId, name: null },
            MODULE_CONSTANTS.FLAGS.HIDDEN,
            true
          );

          if (hideResult.ok) {
            this.platformUI.notify(`Journal "${journalId}" wurde ausgeblendet`, "info");
            this.notificationCenter.debug(
              `Journal ${journalId} hidden via context menu`,
              { journalId },
              { channels: ["ConsoleChannel"] }
            );
          } else {
            this.notificationCenter.error(
              `Failed to hide journal ${journalId}`,
              hideResult.error,
              { channels: ["ConsoleChannel", "UINotificationChannel"] }
            );
          }
        },
      });
    }
  }
}

/**
 * DI-enabled wrapper for HideJournalContextMenuHandler.
 */
export class DIHideJournalContextMenuHandler extends HideJournalContextMenuHandler {
  static dependencies = [
    journalVisibilityServiceToken,
    platformUIPortToken,
    notificationCenterToken,
  ] as const;

  constructor(
    journalVisibility: JournalVisibilityService,
    platformUI: PlatformUI,
    notificationCenter: NotificationCenter
  ) {
    super(journalVisibility, platformUI, notificationCenter);
  }
}
```

### 5. Use-Case als Orchestrator - Registriert alle Handler

**Datei:** `src/application/use-cases/register-context-menu.use-case.ts` (oder umbenennen von `register-journal-context-menu.use-case.ts`)

```typescript
import type { Result } from "@/domain/types/result";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { JournalContextMenuHandler } from "@/application/handlers/journal-context-menu-handler.interface";
import type { EventRegistrar } from "./event-registrar.interface";
import { journalEventPortToken } from "@/infrastructure/shared/tokens";
import { ok, err } from "@/infrastructure/shared/utils/result";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";

/**
 * Use-Case: Register custom context menu entries for journal entries.
 *
 * Orchestrates multiple handlers that can add menu items.
 * Platform-agnostic - works with any JournalEventPort implementation.
 *
 * @example
 * ```typescript
 * const useCase = new RegisterContextMenuUseCase(
 *   journalEvents,
 *   [hideJournalHandler, showJournalHandler] // Array of handlers
 * );
 *
 * useCase.register();  // Start listening
 * useCase.dispose();   // Stop listening
 * ```
 */
export class RegisterContextMenuUseCase implements EventRegistrar {
  private registrationId: EventRegistrationId | undefined;

  constructor(
    private readonly journalEvents: JournalEventPort,
    private readonly handlers: JournalContextMenuHandler[]
  ) {}

  /**
   * Register event listener for context menu events.
   * All handlers are called for each context menu event.
   */
  register(): Result<void, Error> {
    const result = this.journalEvents.onJournalContextMenu((event) => {
      // Rufe alle Handler auf
      for (const handler of this.handlers) {
        handler.handle(event);
      }
    });

    if (result.ok) {
      this.registrationId = result.value;
      return ok(undefined);
    } else {
      return err(new Error(result.error.message));
    }
  }

  /**
   * Cleanup: Unregister event listener.
   */
  dispose(): void {
    if (this.registrationId !== undefined) {
      this.journalEvents.unregisterListener(this.registrationId);
      this.registrationId = undefined;
    }
  }
}

/**
 * DI-enabled wrapper for RegisterContextMenuUseCase.
 * Resolves handlers from container.
 */
export class DIRegisterContextMenuUseCase extends RegisterContextMenuUseCase {
  static dependencies = [
    journalEventPortToken,
    // Handler werden über Factory oder Array-Token registriert
  ] as const;

  constructor(
    journalEvents: JournalEventPort,
    handlers: JournalContextMenuHandler[]
  ) {
    super(journalEvents, handlers);
  }
}
```

**Wichtig:**
- **Orchestrator-Pattern** - Use-Case koordiniert mehrere Handler
- **Erweiterbar** - Neue Handler einfach hinzufügen
- **Separation of Concerns** - Jeder Handler hat eine klare Verantwortung
- **Platform-agnostic** - Handler kennen keine Foundry-Details

### 6. Handler registrieren (via DI oder Factory)

**Option A: Handler-Array über Token**

**Datei:** `src/infrastructure/shared/tokens/index.ts`

```typescript
export const journalContextMenuHandlersToken: InjectionToken<
  JournalContextMenuHandler[]
> = createInjectionToken<JournalContextMenuHandler[]>("JournalContextMenuHandlers");
```

**Datei:** `src/framework/config/modules/event-ports.config.ts`

```typescript
// Handler registrieren
const hideJournalHandlerResult = container.registerClass(
  hideJournalContextMenuHandlerToken,
  DIHideJournalContextMenuHandler,
  ServiceLifecycle.SINGLETON
);

// Handler-Array als Value registrieren
const handlersArray = [
  container.resolve(hideJournalContextMenuHandlerToken),
  // Weitere Handler hier hinzufügen
];
const handlersResult = container.registerValue(
  journalContextMenuHandlersToken,
  handlersArray
);

// Use-Case mit Handler-Array registrieren
const contextMenuUseCaseResult = container.registerFactory(
  registerContextMenuUseCaseToken,
  (container) => {
    const journalEvents = container.resolve(journalEventPortToken);
    const handlers = container.resolve(journalContextMenuHandlersToken);
    return new DIRegisterContextMenuUseCase(journalEvents, handlers);
  },
  ServiceLifecycle.SINGLETON
);
```

**Option B: Handler direkt im Use-Case Constructor (einfacher)**

```typescript
export class DIRegisterContextMenuUseCase extends RegisterContextMenuUseCase {
  static dependencies = [
    journalEventPortToken,
    hideJournalContextMenuHandlerToken,
    // Weitere Handler-Tokens hier hinzufügen
  ] as const;

  constructor(
    journalEvents: JournalEventPort,
    hideJournalHandler: HideJournalContextMenuHandler,
    // Weitere Handler hier
  ) {
    super(journalEvents, [hideJournalHandler /*, weitere Handler */]);
  }
}
```

### 7. Weitere Handler hinzufügen (Beispiel)

**Datei:** `src/application/handlers/show-journal-context-menu-handler.ts`

```typescript
import type { JournalContextMenuHandler } from "./journal-context-menu-handler.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/journal-event-port.interface";
// ... weitere Imports ...

/**
 * Handler that adds "Journal einblenden" menu item for hidden journals.
 */
export class ShowJournalContextMenuHandler implements JournalContextMenuHandler {
  constructor(
    private readonly journalVisibility: JournalVisibilityService,
    // ... weitere Dependencies
  ) {}

  handle(event: JournalContextMenuEvent): void {
    const journalId = /* ... extrahieren ... */;
    if (!journalId) return;

    // Prüfe, ob Journal versteckt ist
    const flagResult = this.journalVisibility.getEntryFlag(
      { id: journalId, name: null },
      MODULE_CONSTANTS.FLAGS.HIDDEN
    );

    // Nur hinzufügen, wenn versteckt
    if (flagResult.ok && flagResult.value === true) {
      event.options.push({
        name: "Journal einblenden",
        icon: '<i class="fas fa-eye"></i>',
        callback: async (li) => {
          // Journal einblenden
        },
      });
    }
  }
}
```

**In Use-Case hinzufügen:**
```typescript
constructor(
  journalEvents: JournalEventPort,
  hideJournalHandler: HideJournalContextMenuHandler,
  showJournalHandler: ShowJournalContextMenuHandler, // ← Neu
) {
  super(journalEvents, [hideJournalHandler, showJournalHandler]);
}
```

### 4. Use-Case registrieren (bereits vorhanden)

**Datei:** `src/framework/config/modules/event-ports.config.ts`

Der Use-Case wird bereits registriert (ersetzt `RegisterJournalContextMenuUseCase`):

```typescript
// ... existing imports ...
import { DIRegisterContextMenuUseCase } from "@/application/use-cases/register-context-menu.use-case";
import { registerContextMenuUseCaseToken } from "@/infrastructure/shared/tokens";

export function registerEventPorts(container: ServiceContainer): Result<void, string> {
  // ... existing registrations ...

  // Register RegisterContextMenuUseCase (ersetzt RegisterJournalContextMenuUseCase)
  const contextMenuUseCaseResult = container.registerClass(
    registerContextMenuUseCaseToken,
    DIRegisterContextMenuUseCase,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(contextMenuUseCaseResult)) {
    return err(
      `Failed to register RegisterContextMenuUseCase: ${contextMenuUseCaseResult.error.message}`
    );
  }

  // ... rest of function ...
}
```

### 5. Alte Implementierung entfernen

**Datei:** `src/application/use-cases/register-journal-context-menu.use-case.ts`
- ❌ **Entfernen** - wird durch `RegisterContextMenuUseCase` ersetzt

**Token aktualisieren:**
**Datei:** `src/infrastructure/shared/tokens/index.ts`

```typescript
// Alten Token entfernen oder umbenennen:
// export const registerJournalContextMenuUseCaseToken = ... ❌

// Neuer Token (oder umbenennen):
export const registerContextMenuUseCaseToken: InjectionToken<EventRegistrar> =
  createInjectionToken<EventRegistrar>("RegisterContextMenuUseCase");
```

---

## ❌ NICHT MEHR NÖTIG (alte Implementierung)

Die folgenden Schritte sind **nicht mehr nötig**, da wir das Event-Port-Pattern nutzen:

### ~~2. Interface: FoundryContextMenu~~

**Datei:** `src/infrastructure/adapters/foundry/interfaces/FoundryContextMenu.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Menu item structure for Foundry context menus.
 */
export interface ContextMenuItem {
  name: string;
  icon: string;
  condition: boolean | (() => boolean);
  callback: (li: HTMLElement) => void | Promise<void>;
}

/**
 * Interface for Foundry ContextMenu manipulation.
 * Abstracts context menu customization via libWrapper.
 *
 * Extends Disposable for consistent resource cleanup.
 */
export interface FoundryContextMenu extends Disposable {
  /**
   * Registers a custom menu item handler for journal entries.
   * The handler will be called when a journal entry context menu is rendered.
   *
   * @param handler - Function that receives the target element and menuItems array
   * @returns Result indicating success or a FoundryError
   */
  registerJournalContextMenuItem(
    handler: (target: HTMLElement, menuItems: ContextMenuItem[]) => void
  ): Result<void, FoundryError>;

  /**
   * Unregisters the context menu customization.
   * Should be called during cleanup/dispose.
   *
   * @returns Result indicating success or a FoundryError
   */
  unregisterJournalContextMenuItem(): Result<void, FoundryError>;
}
```

### 3. Port v13: FoundryContextMenuPortV13

**Datei:** `src/infrastructure/adapters/foundry/ports/v13/FoundryContextMenuPort.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { FoundryContextMenu, ContextMenuItem } from "../../interfaces/FoundryContextMenu";
import type { FoundryError } from "../../errors/FoundryErrors";
import { ok, err, tryCatch } from "@/infrastructure/shared/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";

/**
 * v13 implementation of FoundryContextMenu interface.
 * Uses libWrapper to safely override ContextMenu.prototype.render.
 */
export class FoundryContextMenuPortV13 implements FoundryContextMenu {
  #disposed = false;
  #registered = false;
  #handler: ((target: HTMLElement, menuItems: ContextMenuItem[]) => void) | null = null;

  registerJournalContextMenuItem(
    handler: (target: HTMLElement, menuItems: ContextMenuItem[]) => void
  ): Result<void, FoundryError> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot register on disposed port"));
    }

    if (this.#registered) {
      return err(
        createFoundryError(
          "ALREADY_REGISTERED",
          "Context menu handler already registered. Unregister first."
        )
      );
    }

    // Prüfe libWrapper Verfügbarkeit
    if (typeof libWrapper === "undefined") {
      return err(
        createFoundryError("API_NOT_AVAILABLE", "libWrapper is not available")
      );
    }

    // Prüfe ContextMenu Verfügbarkeit
    const ContextMenuClass =
      foundry?.applications?.ux?.ContextMenu?.implementation || ContextMenu;
    if (!ContextMenuClass) {
      return err(
        createFoundryError("API_NOT_AVAILABLE", "ContextMenu is not available")
      );
    }

    this.#handler = handler;

    // Registriere libWrapper Wrapper
    // WICHTIG: Arrow-Function würde `this` falsch binden, daher normale Function
    const handlerRef = this.#handler; // Closure für Handler
    const result = tryCatch(
      () => {
        libWrapper.register(
          MODULE_CONSTANTS.MODULE.ID,
          "ContextMenu.prototype.render",
          function (target: HTMLElement, options = {}) {
            // `this` ist hier das ContextMenu-Objekt (nicht Port-Instanz)
            if (!handlerRef || !this.menuItems) {
              return libWrapper.callOriginal(this, target, options);
            }

            // Prüfe, ob es ein Journal-Eintrag ist
            const journalId =
              target.getAttribute?.("data-entry-id") ||
              target.getAttribute?.("data-document-id");

            if (journalId) {
              // Rufe Handler auf, damit Use-Case MenuItem hinzufügen kann
              handlerRef(target, this.menuItems);
            }

            return libWrapper.callOriginal(this, target, options);
          },
          "WRAPPER"
        );
        this.#registered = true;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to register context menu wrapper",
          {},
          error
        )
    );

    if (!result.ok) {
      this.#handler = null;
      return result;
    }

    return ok(undefined);
  }

  unregisterJournalContextMenuItem(): Result<void, FoundryError> {
    if (!this.#registered) {
      return ok(undefined); // Idempotent
    }

    const result = tryCatch(
      () => {
        if (typeof libWrapper !== "undefined") {
          libWrapper.unregister(MODULE_CONSTANTS.MODULE.ID, "ContextMenu.prototype.render");
        }
        this.#registered = false;
        this.#handler = null;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to unregister context menu wrapper",
          {},
          error
        )
    );

    if (!result.ok) {
      return result;
    }

    return ok(undefined);
  }

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.unregisterJournalContextMenuItem(); // Cleanup
    this.#disposed = true;
  }
}
```

### 4. Service: FoundryContextMenuService

**Datei:** `src/infrastructure/adapters/foundry/services/FoundryContextMenuService.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { FoundryContextMenu, ContextMenuItem } from "../interfaces/FoundryContextMenu";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import {
  portSelectorToken,
  foundryContextMenuPortRegistryToken,
} from "@/infrastructure/shared/tokens/foundry.tokens";
import { retryServiceToken } from "@/infrastructure/shared/tokens";
import { FoundryServiceBase } from "./FoundryServiceBase";

/**
 * Service wrapper for FoundryContextMenu that automatically selects the appropriate port
 * based on the current Foundry version.
 */
export class FoundryContextMenuService
  extends FoundryServiceBase<FoundryContextMenu>
  implements FoundryContextMenu
{
  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryContextMenu>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }

  registerJournalContextMenuItem(
    handler: (target: HTMLElement, menuItems: ContextMenuItem[]) => void
  ): Result<void, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryContextMenu");
      if (!portResult.ok) return portResult;
      return portResult.value.registerJournalContextMenuItem(handler);
    }, "FoundryContextMenu.registerJournalContextMenuItem");
  }

  unregisterJournalContextMenuItem(): Result<void, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryContextMenu");
      if (!portResult.ok) return portResult;
      return portResult.value.unregisterJournalContextMenuItem();
    }, "FoundryContextMenu.unregisterJournalContextMenuItem");
  }
}

export class DIFoundryContextMenuService extends FoundryContextMenuService {
  static dependencies = [
    portSelectorToken,
    foundryContextMenuPortRegistryToken,
    retryServiceToken,
  ] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryContextMenu>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }
}
```

### 5. Tokens hinzufügen

**Datei:** `src/infrastructure/shared/tokens/foundry.tokens.ts`

```typescript
// ... existing imports ...
import type { FoundryContextMenu } from "@/infrastructure/adapters/foundry/interfaces/FoundryContextMenu";

// ... existing tokens ...

/**
 * Injection token for FoundryContextMenu service.
 */
export const foundryContextMenuToken: InjectionToken<FoundryContextMenu> =
  createInjectionToken<FoundryContextMenu>("FoundryContextMenu");

/**
 * Injection token for FoundryContextMenu PortRegistry.
 */
export const foundryContextMenuPortRegistryToken: InjectionToken<
  PortRegistry<FoundryContextMenu>
> = createInjectionToken<PortRegistry<FoundryContextMenu>>("FoundryContextMenuPortRegistry");
```

### 6. Port Registry registrieren

**Datei:** `src/framework/config/modules/port-infrastructure.config.ts`

```typescript
// ... existing imports ...
import { FoundryContextMenuPortV13 } from "@/infrastructure/adapters/foundry/ports/v13/FoundryContextMenuPort";
import type { FoundryContextMenu } from "@/infrastructure/adapters/foundry/interfaces/FoundryContextMenu";
import {
  foundryContextMenuPortRegistryToken,
  // ... existing tokens ...
} from "@/infrastructure/shared/tokens/foundry.tokens";

function createPortRegistries(): Result<
  {
    // ... existing registries ...
    contextMenuPortRegistry: PortRegistry<FoundryContextMenu>;
  },
  string
> {
  // ... existing registry creation ...

  // Create and populate FoundryContextMenu registry
  const contextMenuPortRegistry = new PortRegistry<FoundryContextMenu>();
  registerPortToRegistry(
    contextMenuPortRegistry,
    13,
    () => new FoundryContextMenuPortV13(),
    "FoundryContextMenu",
    portRegistrationErrors
  );

  return ok({
    // ... existing registries ...
    contextMenuPortRegistry,
  });
}

export function registerPortRegistries(container: ServiceContainer): Result<void, string> {
  const portsResult = createPortRegistries();
  // ... existing code ...

  // Register FoundryContextMenu PortRegistry
  const contextMenuRegistryResult = container.registerValue(
    foundryContextMenuPortRegistryToken,
    portsResult.value.contextMenuPortRegistry
  );
  if (isErr(contextMenuRegistryResult)) {
    return err(
      `Failed to register FoundryContextMenu PortRegistry: ${contextMenuRegistryResult.error.message}`
    );
  }

  return ok(undefined);
}
```

### 7. Service registrieren

**Datei:** `src/framework/config/modules/foundry-services.config.ts`

```typescript
// ... existing imports ...
import { DIFoundryContextMenuService } from "@/infrastructure/adapters/foundry/services/FoundryContextMenuService";
import { foundryContextMenuToken } from "@/infrastructure/shared/tokens";

export function registerFoundryServices(container: ServiceContainer): Result<void, string> {
  // ... existing registrations ...

  // Register FoundryContextMenuService
  const contextMenuServiceResult = container.registerClass(
    foundryContextMenuToken,
    DIFoundryContextMenuService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(contextMenuServiceResult)) {
    return err(
      `Failed to register FoundryContextMenu service: ${contextMenuServiceResult.error.message}`
    );
  }

  return ok(undefined);
}
```

### 8. Use-Case: RegisterContextMenuUseCase

**Datei:** `src/application/use-cases/register-context-menu.use-case.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { EventRegistrar } from "@/application/interfaces/EventRegistrar";
import type { FoundryContextMenu, ContextMenuItem } from "@/infrastructure/adapters/foundry/interfaces/FoundryContextMenu";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { PlatformUI } from "@/infrastructure/platform/interfaces/PlatformUI";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import { foundryContextMenuToken } from "@/infrastructure/shared/tokens/foundry.tokens";
import { journalVisibilityServiceToken } from "@/infrastructure/shared/tokens";
import { platformUIPortToken } from "@/infrastructure/shared/tokens";
import { notificationCenterToken } from "@/infrastructure/shared/tokens";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { ok, err } from "@/infrastructure/shared/utils/result";
import type { ServiceContainer } from "@/infrastructure/di/container";

/**
 * Use-Case for registering custom context menu entries for journal entries.
 * Implements EventRegistrar pattern for consistent event registration.
 */
export class RegisterContextMenuUseCase implements EventRegistrar {
  constructor(
    private readonly container: ServiceContainer,
    private readonly contextMenu: FoundryContextMenu,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly platformUI: PlatformUI,
    private readonly notificationCenter: NotificationCenter
  ) {}

  register(): Result<void, Error> {
    const result = this.contextMenu.registerJournalContextMenuItem(
      (target: HTMLElement, menuItems: ContextMenuItem[]) => {
        // Extrahiere Journal-ID
        const journalId =
          target.getAttribute?.("data-entry-id") ||
          target.getAttribute?.("data-document-id");

        if (!journalId) {
          return; // Kein Journal-Eintrag
        }

        // Prüfe, ob unser MenuItem bereits existiert
        const existingItem = menuItems.find(
          (item) => item.name === "Journal ausblenden"
        );

        if (existingItem) {
          return; // Bereits hinzugefügt
        }

        // Prüfe, ob Journal bereits versteckt ist
        const flagResult = this.journalVisibility.getEntryFlag(
          { id: journalId, name: null },
          MODULE_CONSTANTS.FLAGS.HIDDEN
        );

        // Nur hinzufügen, wenn nicht versteckt
        if (flagResult.ok && flagResult.value !== true) {
          menuItems.push({
            name: "Journal ausblenden",
            icon: '<i class="fas fa-eye-slash"></i>',
            condition: true,
            callback: async (li: HTMLElement) => {
              // Journal verstecken
              const hideResult = await this.journalVisibility.setEntryFlag(
                { id: journalId, name: null },
                MODULE_CONSTANTS.FLAGS.HIDDEN,
                true
              );

              if (hideResult.ok) {
                this.platformUI.notify(`Journal "${journalId}" wurde ausgeblendet`, "info");
                this.notificationCenter.debug(
                  `Journal ${journalId} hidden via context menu`,
                  { journalId },
                  { channels: ["ConsoleChannel"] }
                );
              } else {
                this.notificationCenter.error(
                  `Failed to hide journal ${journalId}`,
                  hideResult.error,
                  { channels: ["ConsoleChannel", "UINotificationChannel"] }
                );
              }
            },
          });
        }
      }
    );

    if (!result.ok) {
      return err(new Error(`Failed to register context menu: ${result.error.message}`));
    }

    return ok(undefined);
  }

  dispose(): void {
    this.contextMenu.unregisterJournalContextMenuItem();
  }
}

export class DIRegisterContextMenuUseCase extends RegisterContextMenuUseCase {
  static dependencies = [
    serviceContainerToken,
    foundryContextMenuToken,
    journalVisibilityServiceToken,
    platformUIPortToken,
    notificationCenterToken,
  ] as const;

  constructor(
    container: ServiceContainer,
    contextMenu: FoundryContextMenu,
    journalVisibility: JournalVisibilityService,
    platformUI: PlatformUI,
    notificationCenter: NotificationCenter
  ) {
    super(container, contextMenu, journalVisibility, platformUI, notificationCenter);
  }
}
```

### 9. Use-Case registrieren

**Datei:** `src/framework/config/modules/event-ports.config.ts`

Der Use-Case wird in der Event-Ports-Konfiguration registriert, wie andere Use-Cases auch:

```typescript
// ... existing imports ...
import { DIRegisterContextMenuUseCase } from "@/application/use-cases/register-context-menu.use-case";
import { registerContextMenuUseCaseToken } from "@/infrastructure/shared/tokens";

export function registerEventPorts(container: ServiceContainer): Result<void, string> {
  // ... existing registrations ...

  // Register RegisterContextMenuUseCase
  const contextMenuUseCaseResult = container.registerClass(
    registerContextMenuUseCaseToken,
    DIRegisterContextMenuUseCase,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(contextMenuUseCaseResult)) {
    return err(
      `Failed to register RegisterContextMenuUseCase: ${contextMenuUseCaseResult.error.message}`
    );
  }

  // ... rest of function ...
}
```

**Automatische Registrierung über ModuleEventRegistrar:**
- `ModuleEventRegistrar` findet automatisch alle `EventRegistrar`-Implementierungen im Container
- Ruft `register()` für jeden Use-Case auf
- Cleanup erfolgt automatisch bei Modul-Deaktivierung via `dispose()`

**Token hinzufügen:**
**Datei:** `src/infrastructure/shared/tokens/index.ts` oder entsprechende Token-Datei

```typescript
export const registerContextMenuUseCaseToken: InjectionToken<EventRegistrar> =
  createInjectionToken<EventRegistrar>("RegisterContextMenuUseCase");
```

### 10. Alte Implementierung entfernen/anpassen

**RegisterJournalContextMenuUseCase:**
- ❌ **Entfernen** - wird durch `RegisterContextMenuUseCase` ersetzt
- Alte Datei: `src/application/use-cases/register-journal-context-menu.use-case.ts`

**FoundryJournalEventAdapter.onJournalContextMenu:**
- ⚠️ **Als deprecated markieren** (Option B - kein Breaking Change)
- Methode bleibt, gibt Warnung aus
- Dokumentation aktualisieren
- **Datei:** `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts`

---

## 🔄 Erweiterbarkeit: Weitere Handler hinzufügen

Das Handler-Pattern macht es einfach, weitere Context-Menü-Items hinzuzufügen:

### Beispiel: "Journal einblenden" Handler

1. **Neuer Handler implementieren:**
```typescript
// src/application/handlers/show-journal-context-menu-handler.ts
export class ShowJournalContextMenuHandler implements JournalContextMenuHandler {
  constructor(
    private readonly journalVisibility: JournalVisibilityService,
    private readonly platformUI: PlatformUI,
    private readonly notificationCenter: NotificationCenter
  ) {}

  handle(event: JournalContextMenuEvent): void {
    const journalId = /* ... extrahieren ... */;
    if (!journalId) return;

    // Prüfe, ob Journal versteckt ist
    const flagResult = this.journalVisibility.getEntryFlag(
      { id: journalId, name: null },
      MODULE_CONSTANTS.FLAGS.HIDDEN
    );

    // Nur hinzufügen, wenn versteckt
    if (flagResult.ok && flagResult.value === true) {
      event.options.push({
        name: "Journal einblenden",
        icon: '<i class="fas fa-eye"></i>',
        callback: async (li) => {
          await this.journalVisibility.setEntryFlag(
            { id: journalId, name: null },
            MODULE_CONSTANTS.FLAGS.HIDDEN,
            false
          );
        },
      });
    }
  }
}
```

2. **Handler im Use-Case registrieren:**
```typescript
// In DIRegisterContextMenuUseCase
static dependencies = [
  journalEventPortToken,
  hideJournalContextMenuHandlerToken,
  showJournalContextMenuHandlerToken, // ← Neu
] as const;

constructor(
  journalEvents: JournalEventPort,
  hideJournalHandler: HideJournalContextMenuHandler,
  showJournalHandler: ShowJournalContextMenuHandler, // ← Neu
) {
  super(journalEvents, [hideJournalHandler, showJournalHandler]); // ← Array erweitern
}
```

3. **Fertig!** - Der neue Handler wird automatisch für alle Context-Menüs aufgerufen.

### Vorteile des Handler-Patterns

- ✅ **Separation of Concerns** - Jeder Handler hat eine klare Verantwortung
- ✅ **Einfach erweiterbar** - Neuer Handler = neue Klasse + Array-Eintrag
- ✅ **Testbar** - Handler einzeln testbar, unabhängig vom Use-Case
- ✅ **Wiederverwendbar** - Handler können in anderen Kontexten genutzt werden
- ✅ **Keine Code-Duplikation** - Event-Port-Registrierung nur einmal im Use-Case

---

## 📝 Umsetzungsschritte

### Phase 1: Dependency & Setup
1. ✅ lib-wrapper als Dependency in `module.json` hinzufügen
2. ✅ Prüfe, ob libWrapper verfügbar ist (in Console testen)

### Phase 2: Event-Adapter erweitern (Infrastructure Layer)
3. ✅ `FoundryJournalEventAdapter.onJournalContextMenu()` umschreiben
   - Statt Hook `getJournalEntryContext` → libWrapper für `ContextMenu.prototype.render`
   - libWrapper nur einmal registrieren (für alle Callbacks)
   - Callbacks in Array speichern und alle aufrufen
   - Cleanup: libWrapper unregisteren, wenn keine Callbacks mehr

### Phase 3: Handler-Pattern (Application Layer)
4. ✅ `JournalContextMenuHandler` Interface definieren
5. ✅ `HideJournalContextMenuHandler` implementieren
   - Extrahiert "Journal ausblenden" Logik in eigenen Handler
   - Klare Separation of Concerns
6. ✅ `RegisterContextMenuUseCase` als Orchestrator
   - Registriert alle Handler beim Event-Port
   - Handler-Array als Dependency
7. ✅ Use-Case Token aktualisieren (`registerContextMenuUseCaseToken`)

### Phase 4: Cleanup & Anpassungen
6. ✅ `RegisterJournalContextMenuUseCase` entfernen (alte Implementierung)
7. ✅ Tests anpassen:
   - `FoundryJournalEventAdapter` Tests (libWrapper mocken)
   - `RegisterContextMenuUseCase` Tests (Event-Port mocken)
   - Integration-Tests (MenuItem erscheint, Callback funktioniert)

### Phase 5: Dokumentation
8. ✅ CHANGELOG.md aktualisieren
9. ✅ ARCHITECTURE.md aktualisieren (Event-Port-Pattern dokumentieren)

---

## 🧪 Testing

### Console-Tests (bereits durchgeführt)
- ✅ ContextMenu.prototype.render überschreiben funktioniert
- ✅ MenuItems können direkt hinzugefügt werden
- ✅ libWrapper ist verfügbar (wenn installiert)

### Unit-Tests
- libWrapper mocken
- Teste, dass libWrapper.register() aufgerufen wird
- Teste, dass MenuItem hinzugefügt wird
- Teste, dass MenuItem nicht hinzugefügt wird, wenn Journal versteckt ist

### Integration-Tests
- Teste, dass MenuItem im Context-Menü erscheint
- Teste, dass Callback funktioniert (Journal wird versteckt)
- Teste, dass Notification angezeigt wird

---

## 🔄 Migration

### Für bestehende Code-Nutzer
- **Keine Breaking Changes** (wenn Option B gewählt wird)
- `onJournalContextMenu()` bleibt verfügbar, ist aber deprecated
- Neue Implementierung nutzt libWrapper direkt

### Für Entwickler
- Use-Case `RegisterJournalContextMenuUseCase` wird entfernt oder umgestellt
- Logik wird direkt in `init-solid.ts` ready-Hook implementiert
- Keine Event-Registrierung mehr nötig

---

## ⚠️ Risiken & Mitigation

### Risiko 1: libWrapper nicht verfügbar
**Mitigation:** Guard-Check im ready-Hook, Warnung loggen, Feature deaktivieren

### Risiko 2: ContextMenu nicht verfügbar
**Mitigation:** Guard-Check, Fallback auf deprecated `ContextMenu`

### Risiko 3: Andere Module überschreiben unser Wrapper
**Mitigation:** libWrapper verhindert das automatisch

### Risiko 4: Services nicht verfügbar
**Mitigation:** Result-Pattern, Fehlerbehandlung, Fallback-Logik

---

## 📚 Referenzen

- **lib-wrapper GitHub**: https://github.com/ruipin/fvtt-lib-wrapper
- **Foundry ContextMenu API**: `C:\Program Files\Foundry Virtual Tabletop\resources\app\client\applications\ux\context-menu.mjs`
- **Foundry DocumentDirectory**: `C:\Program Files\Foundry Virtual Tabletop\resources\app\client\applications\sidebar\document-directory.mjs`
- **Foundry JournalDirectory**: `C:\Program Files\Foundry Virtual Tabletop\resources\app\client\applications\sidebar\tabs\journal-directory.mjs`

---

## ✅ Definition of Done

**Status:** ✅ **ABGESCHLOSSEN in v0.29.0 (2025-11-23)**

### Infrastructure Layer (Event-Adapter)
- [x] `FoundryJournalEventAdapter.onJournalContextMenu()` umgeschrieben
- [x] libWrapper-Integration implementiert (einmalige Registrierung für alle Callbacks)
- [x] Callback-Management (Array von Callbacks, Cleanup bei unregister)
- [x] Tests angepasst (libWrapper mocken)

### Application Layer (Handler-Pattern)
- [x] `JournalContextMenuHandler` Interface definiert
- [x] `HideJournalContextMenuHandler` implementiert
- [x] `RegisterContextMenuUseCase` als Orchestrator (Handler-Array)
- [x] Use-Case Token aktualisiert (`registerContextMenuUseCaseToken`)
- [x] Handler-Token registriert (für DI)

### Cleanup
- [x] `RegisterJournalContextMenuUseCase` entfernt (alte Implementierung)
- [x] Alte Token entfernt/umbenannt (als deprecated markiert)

### Testing
- [x] `FoundryJournalEventAdapter` Tests (libWrapper-Integration)
- [x] `RegisterContextMenuUseCase` Tests (Event-Port mocken)
- [x] Integration-Tests (MenuItem erscheint, Callback funktioniert)

### Funktionalität
- [x] lib-wrapper als Dependency in module.json
- [x] MenuItem "Journal ausblenden" erscheint im Context-Menü
- [x] MenuItem wird nicht angezeigt, wenn Journal bereits versteckt ist
- [x] Callback funktioniert (Journal wird versteckt)
- [x] Notification wird angezeigt

### Dokumentation
- [x] CHANGELOG.md aktualisiert (v0.29.0)
- [x] ARCHITECTURE.md aktualisiert (Event-Port-Pattern dokumentieren)
- [x] Code-Review abgeschlossen


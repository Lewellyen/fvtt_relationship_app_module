import type { Result } from "@/domain/types/result";
import type {
  PlatformJournalEventPort,
  JournalCreatedEvent,
  JournalUpdatedEvent,
  JournalDeletedEvent,
  JournalDirectoryRenderedEvent,
  JournalContextMenuEvent,
  JournalEvent,
  JournalChanges,
} from "@/domain/ports/events/platform-journal-event-port.interface";
import type {
  EventRegistrationId,
  PlatformEventError,
} from "@/domain/ports/events/platform-event-port.interface";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { foundryHooksToken } from "@/infrastructure/shared/tokens";
import {
  getFirstElementIfArray,
  castToRecord,
  normalizeToRecord,
} from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import { tryCatch } from "@/infrastructure/shared/utils/result";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";

// Type for Foundry ContextMenu instance (used by libWrapper)
type FoundryContextMenu = {
  menuItems?: Array<{ name: string; icon: string; callback: () => void }>;
};

// Type for libWrapper wrapper function signature
type LibWrapperFunction = (wrapped: (...args: unknown[]) => unknown, ...args: unknown[]) => unknown;

// Declare libWrapper as global (provided by lib-wrapper module in Foundry)
declare global {
  var libWrapper:
    | {
        register: (
          moduleId: string,
          target: string,
          fn: LibWrapperFunction,
          type: "WRAPPER" | "MIXED" | "OVERRIDE"
        ) => void;
        unregister: (moduleId: string, target: string) => void;
      }
    | undefined;
}

/**
 * Foundry-specific implementation of PlatformJournalEventPort.
 *
 * Maps Foundry's Hook system to platform-agnostic journal events.
 * Uses FoundryHooksPort which implements PlatformEventPort for platform-agnostic event handling.
 *
 * @example
 * ```typescript
 * const adapter = new FoundryJournalEventAdapter(foundryHooksPort);
 *
 * adapter.onJournalCreated((event) => {
 *   console.log(`Journal created: ${event.journalId}`);
 * });
 * ```
 */
export class FoundryJournalEventAdapter implements PlatformJournalEventPort {
  private registrations = new Map<EventRegistrationId, () => void>();
  private nextId = 1;
  private libWrapperRegistered = false;
  private contextMenuCallbacks: Array<(event: JournalContextMenuEvent) => void> = [];

  constructor(private readonly foundryHooksPort: FoundryHooksPort) {}

  // ===== Specialized Journal Methods =====

  onJournalCreated(
    callback: (event: JournalCreatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "createJournalEntry", // Foundry-spezifischer Hook-Name
      (...args: unknown[]) => {
        const [foundryEntry] = args;
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
      "updateJournalEntry", // Foundry-spezifisch
      (...args: unknown[]) => {
        const [foundryEntry, changes] = args;
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
    return this.registerFoundryHook("deleteJournalEntry", (...args: unknown[]) => {
      const [foundryEntry] = args;
      const event: JournalDeletedEvent = {
        journalId: this.extractId(foundryEntry),
        timestamp: Date.now(),
      };
      callback(event);
    });
  }

  onJournalDirectoryRendered(
    callback: (event: JournalDirectoryRenderedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook("renderJournalDirectory", (app: unknown, html: unknown) => {
      const htmlElement = this.extractHtmlElement(html);
      if (!htmlElement) return;

      const event: JournalDirectoryRenderedEvent = {
        htmlElement,
        timestamp: Date.now(),
      };
      callback(event);
    });
  }

  onJournalContextMenu(
    callback: (event: JournalContextMenuEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Prüfe libWrapper Verfügbarkeit
    if (typeof globalThis.libWrapper === "undefined") {
      return {
        ok: false,
        error: {
          code: "API_NOT_AVAILABLE",
          message: "libWrapper is not available",
        },
      };
    }

    // Prüfe ContextMenu Verfügbarkeit
    const contextMenuClass = foundry?.applications?.ux?.ContextMenu?.implementation;
    if (!contextMenuClass) {
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
          // Wrapper function for libWrapper - uses unknown[] for args to match libWrapper signature
          // Bei WRAPPER-Typ ist wrapped der erste Parameter (die Original-Funktion)

          const wrapperFn = function (
            this: FoundryContextMenu,
            wrapped: (...args: unknown[]) => unknown,
            ...args: unknown[]
          ): unknown {
            // Extract target from args (first argument)
            const firstArg = args[0];
            const target: HTMLElement | undefined =
              firstArg instanceof HTMLElement ? firstArg : undefined;

            if (!target) {
              return wrapped.call(this, ...args);
            }

            // `this` ist hier das ContextMenu-Objekt (libWrapper ruft die Funktion mit dem ContextMenu als this auf)
            const menuItemsRaw = this.menuItems;
            if (!menuItemsRaw) {
              return wrapped.call(this, ...args);
            }
            // Type guard: menuItems ist jetzt definitiv definiert
            const menuItems: Array<{ name: string; icon: string; callback: () => void }> =
              menuItemsRaw;

            // Prüfe, ob es ein Journal-Eintrag ist (target zuerst)
            const journalId =
              target.getAttribute?.("data-entry-id") || target.getAttribute?.("data-document-id");

            if (journalId) {
              // Erstelle Event-Objekt (wie im Hook-Pattern)
              const event: JournalContextMenuEvent = {
                htmlElement: target,
                options: menuItems.map(
                  (item: { name: string; icon: string; callback: () => void }) => ({
                    name: item.name,
                    icon: item.icon,
                    callback: item.callback,
                  })
                ),
                timestamp: Date.now(),
              };

              // Rufe alle registrierten Callbacks auf (via Closure)
              // Handler können event.options modifizieren (z.B. neue Menü-Einträge hinzufügen)
              for (const cb of callbacksRef) {
                cb(event);
              }

              // Kopiere die modifizierten options zurück in this.menuItems
              // Wichtig: Nur neue Einträge hinzufügen, nicht alle ersetzen (um andere Modifikationen zu erhalten)
              const existingNames = new Set(menuItems.map((item) => item.name));
              for (const newOption of event.options) {
                if (!existingNames.has(newOption.name)) {
                  // Konvertiere ContextMenuOption zu menuItems-Format
                  menuItems.push({
                    name: newOption.name,
                    icon: newOption.icon,
                    callback: () => {
                      // ContextMenuOption callback erwartet HTMLElement, aber menuItems callback nicht
                      // Wir rufen den callback mit dem target-Element auf
                      const result = newOption.callback(target);
                      // Handle Promise falls vorhanden
                      if (result instanceof Promise) {
                        result.catch(() => {
                          // Ignore errors
                        });
                      }
                    },
                  });
                }
              }
            }

            return wrapped.call(this, ...args);
          };

          // libWrapper is guaranteed to be available here (checked on line 134)
          // TypeScript type narrowing requires explicit check even though we know it exists
          const libWrapperInstance = globalThis.libWrapper;
          if (typeof libWrapperInstance === "undefined") {
            // This path is unreachable due to check on line 134, but required for type narrowing
            throw new Error("libWrapper is not available");
          }

          // libWrapper.register expects a function with specific signature for WRAPPER type
          // The signature matches LibWrapperFunction which is compatible with libWrapper's expected signature
          libWrapperInstance.register(
            MODULE_CONSTANTS.MODULE.ID,
            "foundry.applications.ux.ContextMenu.implementation.prototype.render",
            wrapperFn as LibWrapperFunction,
            "WRAPPER"
          );
          this.libWrapperRegistered = true;
        },
        (error): PlatformEventError => ({
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
            if (typeof globalThis.libWrapper !== "undefined") {
              globalThis.libWrapper.unregister(
                MODULE_CONSTANTS.MODULE.ID,
                "ContextMenu.prototype.render"
              );
            }
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

  // ===== Generic Methods (from PlatformEventPort) =====

  registerListener(
    eventType: string,
    callback: (event: JournalEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Fallback für generische registerListener
    // In der Praxis sollten die spezialisierten Methoden genutzt werden
    // Use registerFoundryHook to ensure proper cleanup tracking
    // Wrap callback to match Foundry hook signature while preserving type safety
    const foundryCallback = (...args: unknown[]): void => {
      // Foundry hooks pass multiple arguments, but we expect a single JournalEvent
      // For generic registerListener, we pass the first argument as the event
      // Type guard: check if first argument is a valid JournalEvent
      if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
        // Type guard: validate that the object has journalId or timestamp property (JournalEvent requirement)
        const candidate = args[0];
        // Type guard: ensure candidate is an object and has required JournalEvent properties
        // Use runtime-safe cast instead of type assertion
        if (
          typeof candidate === "object" &&
          candidate !== null &&
          ("journalId" in candidate || "timestamp" in candidate)
        ) {
          const eventRecord = castToRecord(candidate);
          const event: JournalEvent = {
            journalId: typeof eventRecord.journalId === "string" ? eventRecord.journalId : "",
            timestamp:
              typeof eventRecord.timestamp === "number" ? eventRecord.timestamp : Date.now(),
          };
          callback(event);
        }
      }
    };
    return this.registerFoundryHook(eventType, foundryCallback);
  }

  unregisterListener(registrationId: EventRegistrationId): Result<void, PlatformEventError> {
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
    callback: (...args: unknown[]) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Use PlatformEventPort.registerListener() instead of FoundryHooks.on()
    // Wrap callback to match PlatformEventPort signature (single event parameter)
    // The event parameter contains the original Foundry hook arguments as an array
    const platformCallback = (event: unknown): void => {
      // Foundry hooks pass multiple arguments, but PlatformEventPort expects single event
      // We pass the event as an array to preserve the original Foundry hook signature
      // Type guard: check if event is an array
      // Use explicit type guard function to avoid type assertion
      function isArrayOfUnknown(value: unknown): value is unknown[] {
        return Array.isArray(value);
      }
      if (isArrayOfUnknown(event)) {
        // Type guard: ensure all array elements are valid before spreading
        // Use type predicate to narrow the type
        function isValidArg(arg: unknown): arg is unknown {
          return arg !== null && arg !== undefined;
        }
        const validArgs: unknown[] = event.filter(isValidArg);
        if (validArgs.length > 0) {
          callback(...validArgs);
        }
      } else {
        // Fallback: if event is not an array, pass it as single argument
        // This path is for compatibility with non-array events, which should be rare
        // Type guard: ensure event is not null/undefined before passing
        // Use type narrowing function to avoid type assertion
        function isNotNullOrUndefined(value: unknown): value is NonNullable<unknown> {
          return value !== null && value !== undefined;
        }
        if (isNotNullOrUndefined(event)) {
          callback(event);
        }
      }
    };
    const result = this.foundryHooksPort.registerListener(hookName, platformCallback);

    if (!result.ok) {
      return result;
    }

    const registrationId = result.value;

    // Store cleanup function using PlatformEventPort.unregisterListener()
    this.registrations.set(registrationId, () => {
      this.foundryHooksPort.unregisterListener(registrationId);
    });

    return { ok: true, value: registrationId };
  }

  private extractId(foundryEntry: unknown): string {
    // Foundry entries always have an id property
    if (typeof foundryEntry === "object" && foundryEntry !== null && "id" in foundryEntry) {
      const entry = castToRecord(foundryEntry);
      if (typeof entry.id === "string") {
        return entry.id;
      }
    }
    return "";
  }

  private normalizeChanges(foundryChanges: unknown): JournalChanges {
    if (!foundryChanges || typeof foundryChanges !== "object") {
      return {};
    }
    // Use runtime-safe cast instead of type assertion
    const changes = normalizeToRecord(foundryChanges);
    const result: JournalChanges = { ...changes };
    if (
      changes.flags !== undefined &&
      typeof changes.flags === "object" &&
      changes.flags !== null
    ) {
      // Copy validated object into result.flags using runtime-safe cast
      result.flags = normalizeToRecord(changes.flags);
    }
    if (changes.name !== undefined && typeof changes.name === "string") {
      result.name = changes.name;
    }
    return result;
  }

  private extractHtmlElement(htmlInput: unknown): HTMLElement | null {
    if (htmlInput instanceof HTMLElement) return htmlInput;
    // Use runtime-safe helper for array access with type guard
    return getFirstElementIfArray(htmlInput, (el): el is HTMLElement => el instanceof HTMLElement);
  }
}

/**
 * DI-enabled wrapper for FoundryJournalEventAdapter.
 */
export class DIFoundryJournalEventAdapter extends FoundryJournalEventAdapter {
  static dependencies = [foundryHooksToken] as const;

  constructor(foundryHooksPort: FoundryHooksPort) {
    super(foundryHooksPort);
  }
}

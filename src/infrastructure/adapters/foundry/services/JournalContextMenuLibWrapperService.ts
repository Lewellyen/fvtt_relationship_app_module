import type { Result } from "@/domain/types/result";
import type {
  LibWrapperService,
  LibWrapperFunction,
  LibWrapperRegistrationId,
} from "@/infrastructure/adapters/foundry/interfaces/lib-wrapper-service.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-ui-event-port.interface";
import type { PlatformContextMenuRegistrationPort } from "@/domain/ports/platform-context-menu-registration-port.interface";
import { libWrapperServiceToken } from "@/infrastructure/shared/tokens/foundry/lib-wrapper-service.token";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { err, ok } from "@/domain/utils/result";

// Type for Foundry ContextMenu instance (used by libWrapper)
type FoundryContextMenu = {
  menuItems?: Array<{ name: string; icon: string; callback: () => void }>;
};

// WeakMap zur Verknüpfung von MenuItem-Objekten mit journalIds
// Wird verwendet, um die journalId dynamisch zur Laufzeit zu ermitteln
const menuItemJournalIdMap = new WeakMap<
  { name: string; icon: string; callback: () => void },
  string
>();

/**
 * Service for managing libWrapper registration for journal context menu.
 *
 * This service handles the registration of the libWrapper wrapper function
 * for the Foundry ContextMenu.render method. It manages callbacks that can
 * modify the context menu options for journal entries.
 *
 * NOTE: This is NOT an event system. The libWrapper is registered once during
 * init, and callbacks are registered separately.
 *
 * Implements PlatformContextMenuRegistrationPort for DIP compliance.
 *
 * @example
 * ```typescript
 * const service = new JournalContextMenuLibWrapperService(
 *   libWrapperService,
 *   logger
 * );
 *
 * // Register libWrapper (called during init)
 * const result = service.register();
 *
 * // Add callback for handling context menu
 * service.addCallback((event) => {
 *   event.options.push({
 *     name: "Custom Option",
 *     icon: '<i class="fas fa-star"></i>',
 *     callback: () => { /* ... *\/ }
 *   });
 * });
 * ```
 */
export class JournalContextMenuLibWrapperService implements PlatformContextMenuRegistrationPort {
  private libWrapperRegistered = false;
  private callbacks: Array<(event: JournalContextMenuEvent) => void> = [];
  private registrationId: LibWrapperRegistrationId | undefined;

  constructor(
    private readonly libWrapperService: LibWrapperService,
    private readonly logger: Logger
  ) {}

  /**
   * Register libWrapper for ContextMenu.render.
   * Should be called once during module initialization.
   *
   * @returns Success or error if registration failed
   */
  register(): Result<void, Error> {
    if (this.libWrapperRegistered) {
      return ok(undefined);
    }

    // Prüfe ContextMenu Verfügbarkeit
    const contextMenuClass = globalThis.foundry?.applications?.ux?.ContextMenu?.implementation;
    if (!contextMenuClass) {
      return err(new Error("ContextMenu is not available"));
    }

    // Erstelle Wrapper-Funktion
    const wrapperFn = this.createWrapperFunction();

    // Registriere via LibWrapperService
    const result = this.libWrapperService.register(
      "foundry.applications.ux.ContextMenu.implementation.prototype.render",
      wrapperFn,
      "WRAPPER"
    );

    if (!result.ok) {
      return err(new Error(result.error.message));
    }

    this.registrationId = result.value;
    this.libWrapperRegistered = true;
    this.logger.debug("Journal context menu libWrapper registered");
    return ok(undefined);
  }

  /**
   * Add a callback that will be called when a journal context menu is rendered.
   *
   * @param callback - Callback function that receives the context menu event
   */
  addCallback(callback: (event: JournalContextMenuEvent) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove a previously registered callback.
   *
   * @param callback - The callback function to remove
   */
  removeCallback(callback: (event: JournalContextMenuEvent) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Cleanup: Unregister libWrapper.
   * Should be called during module shutdown.
   */
  dispose(): void {
    if (this.libWrapperRegistered) {
      const result = this.libWrapperService.unregister(
        "foundry.applications.ux.ContextMenu.implementation.prototype.render"
      );
      if (!result.ok) {
        this.logger.warn("Failed to unregister context menu libWrapper", {
          error: result.error,
        });
      }
      this.libWrapperRegistered = false;
      this.registrationId = undefined;
    }
    this.callbacks = [];
  }

  /**
   * Create the wrapper function for libWrapper.
   * This function intercepts ContextMenu.render calls and allows
   * registered callbacks to modify the menu options.
   */
  private createWrapperFunction(): LibWrapperFunction {
    // Closure für Callbacks-Array und Logger (damit libWrapper-Wrapper darauf zugreifen kann)
    const callbacksRef = this.callbacks;
    const loggerRef = this.logger;

    return function (
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
      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = menuItemsRaw;

      // Prüfe, ob es ein Journal-Eintrag ist (target zuerst)
      const journalId =
        target.getAttribute?.("data-entry-id") || target.getAttribute?.("data-document-id");

      if (journalId) {
        // WICHTIG: Entferne zuerst alle unsere eigenen Optionen (um Duplikate zu vermeiden)
        // Das muss VOR dem Erstellen des Events passieren, damit event.options nicht
        // bereits alte Einträge enthält, die dann wieder hinzugefügt werden.
        const ourOptionName = "Journal ausblenden";
        for (let i = menuItems.length - 1; i >= 0; i--) {
          const item = menuItems[i];
          if (item?.name === ourOptionName) {
            // Entferne auch aus WeakMap, wenn vorhanden
            menuItemJournalIdMap.delete(item);
            menuItems.splice(i, 1);
          }
        }

        // Erstelle Event-Objekt (DIP-compliant: journalId statt htmlElement)
        // WICHTIG: Jetzt erstellen, nachdem alte Einträge entfernt wurden
        const event: JournalContextMenuEvent = {
          journalId,
          options: menuItems.map((item: { name: string; icon: string; callback: () => void }) => ({
            name: item.name,
            icon: item.icon,
            // ContextMenuOption.callback erwartet jetzt journalId statt HTMLElement
            callback: (_id: string) => {
              // Foundry menuItems callback hat keine Parameter, aber wir rufen es trotzdem auf
              // Der Handler wird die journalId aus dem Event erhalten
              item.callback();
              // Return void (nicht Promise) für Foundry-Kompatibilität
            },
          })),
          timestamp: Date.now(),
        };

        // Rufe alle registrierten Callbacks auf (via Closure)
        // Handler können event.options modifizieren (z.B. neue Menü-Einträge hinzufügen)
        for (const cb of callbacksRef) {
          cb(event);
        }

        // Jetzt füge alle neuen Optionen hinzu, die von den Handlern erstellt wurden
        // WICHTIG: Callback dynamisieren - journalId zur Laufzeit aus WeakMap ermitteln
        const existingNames = new Set(menuItems.map((item) => item.name));
        for (const newOption of event.options) {
          // Nur neue Optionen hinzufügen, die nicht bereits in menuItems existieren
          // (Handler können auch bestehende Optionen modifizieren, die wir nicht überschreiben wollen)
          if (!existingNames.has(newOption.name)) {
            // Erstelle neues MenuItem-Objekt
            const menuItem: { name: string; icon: string; callback: () => void } = {
              name: newOption.name,
              icon: newOption.icon,
              callback: () => {
                // DYNAMISCH: Ermittle journalId zur Laufzeit aus WeakMap
                // Jedes MenuItem-Objekt ist mit seiner journalId in der WeakMap verknüpft
                const dynamicJournalId = menuItemJournalIdMap.get(menuItem);

                if (!dynamicJournalId) {
                  loggerRef.error("Failed to determine journalId dynamically from WeakMap", {
                    menuItemName: menuItem.name,
                    fallbackJournalId: journalId,
                  });
                  // Fallback: Versuche journalId aus DOM zu ermitteln
                  const contextMenuElement = document.querySelector(".context-menu");
                  if (contextMenuElement) {
                    const journalElement =
                      contextMenuElement.closest("[data-entry-id], [data-document-id]") ||
                      document.querySelector(`[data-entry-id], [data-document-id]`);
                    if (journalElement) {
                      const domJournalId =
                        journalElement.getAttribute("data-entry-id") ||
                        journalElement.getAttribute("data-document-id");
                      if (domJournalId) {
                        const result = newOption.callback(domJournalId);
                        if (result instanceof Promise) {
                          result.catch(() => {});
                        }
                        return;
                      }
                    }
                  }
                  return;
                }

                // Rufe den Handler-Callback mit der dynamisch ermittelten journalId auf
                const result = newOption.callback(dynamicJournalId);
                // Handle Promise falls vorhanden
                if (result instanceof Promise) {
                  result.catch(() => {
                    // Ignore errors
                  });
                }
              },
            };

            // Speichere journalId in WeakMap für dynamischen Zugriff
            menuItemJournalIdMap.set(menuItem, journalId);

            // Füge MenuItem zu menuItems hinzu
            menuItems.push(menuItem);
            // Markiere den Namen als existierend, um Duplikate zu vermeiden
            existingNames.add(newOption.name);
          }
        }
      }

      return wrapped.call(this, ...args);
    };
  }
}

/**
 * DI-enabled wrapper for JournalContextMenuLibWrapperService.
 */
export class DIJournalContextMenuLibWrapperService extends JournalContextMenuLibWrapperService {
  static dependencies = [libWrapperServiceToken, loggerToken] as const;

  constructor(libWrapperService: LibWrapperService, logger: Logger) {
    super(libWrapperService, logger);
  }
}

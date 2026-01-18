import type { Result } from "@/domain/types/result";
import type {
  PlatformJournalUiEventPort,
  JournalDirectoryRenderedEvent,
  JournalUiEvent,
  ContextMenuOption,
} from "@/domain/ports/events/platform-journal-ui-event-port.interface";
import type {
  EventRegistrationId,
  PlatformEventError,
} from "@/domain/ports/events/platform-event-port.interface";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import {
  getFirstElementIfArray,
  castToRecord,
} from "@/infrastructure/di/types/utilities/type-casts";

/**
 * Foundry-specific implementation of PlatformJournalUiEventPort.
 *
 * Maps Foundry's Hook system to platform-agnostic journal UI events.
 * Uses FoundryHooksPort which implements PlatformEventPort for platform-agnostic event handling.
 *
 * NOTE: This adapter handles UI-specific events (directory render, context menu).
 * Core journal lifecycle events are handled by FoundryJournalEventAdapter.
 *
 * @example
 * ```typescript
 * const adapter = new FoundryJournalUiEventAdapter(foundryHooksPort);
 *
 * adapter.onJournalDirectoryRendered((event) => {
 *   console.log(`Journal directory rendered: ${event.directoryId}`);
 * });
 * ```
 */
export class FoundryJournalUiEventAdapter implements PlatformJournalUiEventPort {
  private registrations = new Map<EventRegistrationId, () => void>();
  private nextId = 1;

  constructor(private readonly foundryHooksPort: FoundryHooksPort) {}

  private isArrayOfUnknown(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  private isCallable(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === "function";
  }

  // ===== UI Event Methods =====

  onJournalDirectoryRendered(
    callback: (event: JournalDirectoryRenderedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook("renderJournalDirectory", (app: unknown, html: unknown) => {
      // Extract directory ID from Foundry app (typically "journal")
      const directoryId = this.extractDirectoryId(app);
      if (!directoryId) {
        // Skip if we can't determine directory ID
        return;
      }

      // Verify that HTML element exists (for validation, but don't pass it to domain)
      const htmlElement = this.extractHtmlElement(html);
      if (!htmlElement) {
        // Skip if HTML element is not available
        return;
      }

      // Create platform-agnostic event (no DOM types)
      const event: JournalDirectoryRenderedEvent = {
        directoryId,
        timestamp: Date.now(),
      };
      callback(event);
    });
  }

  // ===== Generic Methods (from PlatformEventPort) =====

  registerListener(
    eventType: string,
    callback: (event: JournalUiEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Fallback für generische registerListener
    // In der Praxis sollten die spezialisierten Methoden genutzt werden
    return this.registerFoundryHook(eventType, (...args: unknown[]) => {
      // For generic registerListener, we need to map Foundry events to JournalUiEvent
      // This is a simplified implementation - specific methods should be used instead
      if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
        const candidate = args[0];
        const event = this.toJournalUiEvent(candidate);
        if (event) {
          callback(event);
        }
      }
    });
  }

  /**
   * Type guard function to convert unknown to JournalUiEvent without type assertion.
   *
   * NOTE: This method is only called from registerListener, which already ensures
   * that candidate is an object and not null. The redundant check was removed
   * to achieve 100% code coverage.
   */
  private toJournalUiEvent(candidate: unknown): JournalUiEvent | null {
    const record = castToRecord(candidate);

    // Check for JournalDirectoryRenderedEvent (has directoryId)
    if ("directoryId" in record && typeof record.directoryId === "string") {
      return {
        directoryId: record.directoryId,
        timestamp: typeof record.timestamp === "number" ? record.timestamp : Date.now(),
      };
    }

    // Check for JournalContextMenuEvent (has journalId and options)
    if (
      "journalId" in record &&
      typeof record.journalId === "string" &&
      "options" in record &&
      this.isArrayOfUnknown(record.options)
    ) {
      // Validate options array elements
      type ContextMenuItem = {
        name: string;
        icon: string;
        callback: (journalId: string) => void | Promise<void>;
      };
      type JournalContextMenuRecord = {
        journalId: string;
        options: unknown[];
        timestamp?: number | undefined;
      };

      const options: ContextMenuOption[] = [];
      const typedRecord: JournalContextMenuRecord = {
        journalId: record.journalId as string,
        options: record.options,
        timestamp: typeof record.timestamp === "number" ? record.timestamp : undefined,
      };

      for (const item of typedRecord.options) {
        if (typeof item !== "object" || item === null) continue;

        const itemRecord = castToRecord(item);
        const name = itemRecord.name;
        const icon = itemRecord.icon;
        const callbackValue = itemRecord.callback;

        if (typeof name !== "string") continue;
        if (typeof icon !== "string") continue;
        if (!this.isCallable(callbackValue)) continue;

        const callback = async (journalId: string): Promise<void> => {
          await callbackValue(journalId);
        };

        const typedItem: ContextMenuItem = {
          name,
          icon,
          callback,
        };
        options.push({
          name: typedItem.name,
          icon: typedItem.icon,
          callback: typedItem.callback,
        });
      }

      return {
        journalId: typedRecord.journalId,
        options,
        timestamp: typeof typedRecord.timestamp === "number" ? typedRecord.timestamp : Date.now(),
      };
    }

    return null;
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
    const platformCallback = (event: unknown): void => {
      function isArrayOfUnknown(value: unknown): value is unknown[] {
        return Array.isArray(value);
      }
      if (isArrayOfUnknown(event)) {
        function isValidArg(arg: unknown): arg is unknown {
          return arg !== null && arg !== undefined;
        }
        const validArgs: unknown[] = event.filter(isValidArg);
        if (validArgs.length > 0) {
          callback(...validArgs);
        }
      } else {
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

  private extractDirectoryId(app: unknown): string | null {
    // Foundry's renderJournalDirectory hook passes the app instance
    // For journal directory, the ID is typically "journal"
    // We can also check app.id or app.tabName if available
    if (typeof app === "object" && app !== null) {
      if ("id" in app && typeof app.id === "string") {
        return app.id;
      }
      if ("tabName" in app && typeof app.tabName === "string") {
        return app.tabName;
      }
    }
    // Default to "journal" for journal directory
    return "journal";
  }

  private extractHtmlElement(htmlInput: unknown): HTMLElement | null {
    if (htmlInput instanceof HTMLElement) return htmlInput;
    return getFirstElementIfArray(htmlInput, (el): el is HTMLElement => el instanceof HTMLElement);
  }
}

/**
 * DI-enabled wrapper for FoundryJournalUiEventAdapter.
 */
export class DIFoundryJournalUiEventAdapter extends FoundryJournalUiEventAdapter {
  static dependencies = [foundryHooksToken] as const;

  constructor(foundryHooksPort: FoundryHooksPort) {
    super(foundryHooksPort);
  }
}

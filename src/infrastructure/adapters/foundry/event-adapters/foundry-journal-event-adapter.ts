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
import { foundryHooksToken } from "@/infrastructure/shared/tokens";
import {
  getFirstElementIfArray,
  castToFoundryHookCallback,
} from "@/infrastructure/di/types/utilities/runtime-safe-cast";

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

  constructor(private readonly foundryHooks: FoundryHooks) {}

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

  // ===== Generic Methods (from PlatformEventPort) =====

  registerListener(
    eventType: string,
    callback: (event: JournalEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Fallback für generische registerListener
    // In der Praxis sollten die spezialisierten Methoden genutzt werden
    // The callback signature matches FoundryHookCallback but TypeScript can't infer this
    return this.registerFoundryHook(eventType, castToFoundryHookCallback(callback));
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
    // Foundry entries always have an id property
    if (typeof foundryEntry === "object" && foundryEntry !== null && "id" in foundryEntry) {
      const entry = foundryEntry as Record<string, unknown>;
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
    // TypeScript can't narrow object to Record without assertion, but we've validated it's an object
    const changes = Object.assign({} as Record<string, unknown>, foundryChanges) as Record<
      string,
      unknown
    >;
    const result: JournalChanges = { ...changes };
    if (
      changes.flags !== undefined &&
      typeof changes.flags === "object" &&
      changes.flags !== null
    ) {
      // Copy validated object into result.flags
      result.flags = Object.assign({} as Record<string, unknown>, changes.flags) as Record<
        string,
        unknown
      >;
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

  constructor(hooks: FoundryHooks) {
    super(hooks);
  }
}

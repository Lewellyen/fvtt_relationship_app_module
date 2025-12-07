import type { Result } from "@/domain/types/result";
import type {
  PlatformJournalEventPort,
  JournalCreatedEvent,
  JournalUpdatedEvent,
  JournalDeletedEvent,
  JournalDirectoryRenderedEvent,
  JournalEvent,
  JournalChanges,
} from "@/domain/ports/events/platform-journal-event-port.interface";
import type {
  EventRegistrationId,
  PlatformEventError,
} from "@/domain/ports/events/platform-event-port.interface";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import {
  getFirstElementIfArray,
  castToRecord,
  normalizeToRecord,
} from "@/infrastructure/di/types/utilities/type-casts";

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

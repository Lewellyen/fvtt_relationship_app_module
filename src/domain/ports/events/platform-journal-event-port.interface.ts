import type { Result } from "@/domain/types/result";
import type { EventRegistrationId, PlatformEventError } from "./platform-event-port.interface";

/**
 * Specialized port for journal lifecycle events.
 *
 * Platform-agnostic abstraction for journal-specific operations.
 * Still platform-agnostic - works with any VTT system.
 */
export interface PlatformJournalEventPort {
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
   * Unregister a previously registered listener.
   *
   * @param registrationId - ID returned from onJournalCreated, onJournalUpdated, or onJournalDeleted
   * @returns Success or error
   */
  unregisterListener(registrationId: EventRegistrationId): Result<void, PlatformEventError>;
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
 * Changes detected in a journal update event.
 */
export interface JournalChanges {
  flags?: Record<string, unknown>;
  name?: string;
  [key: string]: unknown;
}

/**
 * Union type of all journal lifecycle events.
 *
 * NOTE: UI-specific events (directory render, context menu) are handled
 * by PlatformJournalUiEventPort to maintain DIP compliance.
 */
export type JournalEvent = JournalCreatedEvent | JournalUpdatedEvent | JournalDeletedEvent;

import type { Result } from "@/domain/types/result";
import type {
  PlatformEventPort,
  EventRegistrationId,
  PlatformEventError,
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

  /**
   * Register listener for journal context menu events.
   *
   * NOTE: This is UI-specific and might not exist on all platforms.
   * Non-UI platforms (CSV, API) can return success without doing anything.
   *
   * Platform mappings:
   * - Foundry: "getJournalEntryContext" hook
   * - Roll20: Context menu event
   * - CSV: No-op (not applicable)
   */
  onJournalContextMenu(
    callback: (event: JournalContextMenuEvent) => void
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
  htmlElement: HTMLElement; // DOM ist überall gleich
  timestamp: number;
}

/**
 * Event fired when the journal context menu is about to be displayed.
 * Only applicable for platforms with UI.
 */
export interface JournalContextMenuEvent {
  htmlElement: HTMLElement; // DOM ist überall gleich
  options: ContextMenuOption[]; // Mutable array - can be modified to add/remove options
  timestamp: number;
}

/**
 * Context menu option that can be added to the journal context menu.
 */
export interface ContextMenuOption {
  name: string;
  icon: string;
  callback: (li: HTMLElement) => void | Promise<void>;
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
  | JournalDirectoryRenderedEvent
  | JournalContextMenuEvent;

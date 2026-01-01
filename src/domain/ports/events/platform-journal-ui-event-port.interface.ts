import type { Result } from "@/domain/types/result";
import type {
  PlatformEventPort,
  EventRegistrationId,
  PlatformEventError,
} from "./platform-event-port.interface";

/**
 * Port for UI-specific journal events.
 *
 * This port handles UI-related events that are not part of the core journal lifecycle.
 * UI events are separated from core events to maintain DIP compliance - the domain
 * layer should not depend on DOM/UI types.
 *
 * Platform mappings:
 * - Foundry: Various UI hooks (renderJournalDirectory, context menu)
 * - Roll20: UI-specific events
 * - CSV/Headless: No-op (not applicable)
 */
export interface PlatformJournalUiEventPort extends PlatformEventPort<JournalUiEvent> {
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

// ===== UI-Event Types (Platform-Agnostic, No DOM Types) =====

/**
 * Event fired when the journal directory UI is rendered.
 * Only applicable for platforms with UI.
 *
 * NOTE: This event does NOT contain DOM types. The directoryId can be used
 * to identify which directory was rendered. For DOM manipulation, use
 * PlatformJournalDirectoryUiPort instead.
 */
export interface JournalDirectoryRenderedEvent {
  /**
   * Identifier for the journal directory that was rendered.
   * For Foundry, this is typically "journal".
   * For other platforms, this may be a unique identifier.
   */
  directoryId: string;
  timestamp: number;
}

/**
 * Event fired when the journal context menu is about to be displayed.
 * Only applicable for platforms with UI.
 *
 * NOTE: This event does NOT contain DOM types. The journalId can be used
 * to identify which journal entry's context menu is being shown.
 * For DOM manipulation, use PlatformContextMenuRegistrationPort instead.
 */
export interface JournalContextMenuEvent {
  /**
   * The ID of the journal entry whose context menu is being shown.
   */
  journalId: string;
  /**
   * Context menu options that can be modified.
   * These are platform-agnostic representations, not DOM-specific.
   */
  options: ContextMenuOption[];
  timestamp: number;
}

/**
 * Context menu option that can be added to the journal context menu.
 *
 * NOTE: The callback does NOT receive HTMLElement. For DOM manipulation,
 * use PlatformContextMenuRegistrationPort which provides DOM access.
 */
export interface ContextMenuOption {
  name: string;
  icon: string;
  /**
   * Callback function that is called when the menu option is selected.
   * Receives the journalId instead of HTMLElement for platform-agnostic behavior.
   */
  callback: (journalId: string) => void | Promise<void>;
}

/**
 * Union type of all journal UI events.
 */
export type JournalUiEvent = JournalDirectoryRenderedEvent | JournalContextMenuEvent;

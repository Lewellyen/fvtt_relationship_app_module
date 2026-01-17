import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic port for adding buttons to the journal directory UI.
 *
 * The implementation is responsible for:
 * - hooking into the platform's UI render lifecycle
 * - DOM manipulation / UI element creation
 *
 * Callers provide pure callbacks; no DOM types are exposed in this interface (DIP).
 */
export interface PlatformJournalDirectoryButtonsPort {
  registerButtons(config: JournalDirectoryButtonsConfig): Result<void, string>;
}

export interface JournalDirectoryButtonsConfig {
  /**
   * Predicate to decide if buttons should be shown for the current user.
   * Platform implementation provides the current user role (or undefined if unknown).
   */
  shouldShowButtons: (userRole?: number) => boolean;

  /**
   * Called when the \"show all hidden journals\" button is clicked.
   */
  onShowAllHiddenJournalsClick: () => Promise<void>;

  /**
   * Called when the \"journal overview\" button is clicked.
   */
  onOpenJournalOverviewClick: () => Promise<void>;

  showAllButton: {
    title: string;
    labelHtml: string;
    cssClass: string;
  };

  overviewButton: {
    title: string;
    labelHtml: string;
    cssClass: string;
  };
}

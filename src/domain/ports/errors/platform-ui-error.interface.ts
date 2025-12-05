/**
 * Platform-agnostic error types for UI operations.
 *
 * Diese Error-Types werden von mehreren Port-Interfaces verwendet:
 * - PlatformUIPort
 * - JournalDirectoryUiPort
 * - NotificationPort
 *
 * Ausgelagert in separate Datei, um zirkuläre Abhängigkeiten zu vermeiden.
 */

/**
 * Base error interface for platform UI operations.
 */
export interface PlatformUIError {
  code: string;
  message: string;
  operation?: string;
  details?: unknown;
}

/**
 * Specific error codes for UI operations.
 */
export const PLATFORM_UI_ERROR_CODES = {
  JOURNAL_ELEMENT_NOT_FOUND: "JOURNAL_ELEMENT_NOT_FOUND",
  JOURNAL_DIRECTORY_NOT_OPEN: "JOURNAL_DIRECTORY_NOT_OPEN",
  NOTIFICATION_FAILED: "NOTIFICATION_FAILED",
  DOM_MANIPULATION_FAILED: "DOM_MANIPULATION_FAILED",
} as const;

export type PlatformUIErrorCode =
  (typeof PLATFORM_UI_ERROR_CODES)[keyof typeof PLATFORM_UI_ERROR_CODES];

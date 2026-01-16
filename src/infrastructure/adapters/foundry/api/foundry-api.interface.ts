/**
 * Foundry API Interfaces for Dependency Injection
 *
 * These interfaces abstract Foundry VTT's global APIs (game.*, ui.*, Hooks.*)
 * to enable dependency injection and improve testability of Port implementations.
 *
 * Ports receive these interfaces via constructor injection, allowing:
 * - Easy mocking in tests without full Foundry environment
 * - Better separation of concerns
 * - Version-independent API access patterns
 */

import type { FoundryJournalEntry } from "../types";
import type { SettingConfig } from "../interfaces/FoundrySettings";
import type { FoundryNotificationOptions } from "../interfaces/FoundryUI";
import type { FoundryHookCallback } from "../types";

/**
 * Interface for Foundry's game.journal API
 */
export interface IFoundryGameJournalAPI {
  /**
   * Array of all journal entries (DocumentCollection.contents)
   */
  contents: FoundryJournalEntry[];

  /**
   * Get a journal entry by ID
   * @param id - Journal entry ID
   * @returns Journal entry or undefined if not found
   */
  get(id: string): FoundryJournalEntry | undefined;

  /**
   * Directory for journal entries (used for rendering)
   */
  directory?:
    | {
        render?: () => void;
      }
    | undefined;
}

/**
 * Interface for Foundry's game API
 */
export interface IFoundryGameAPI {
  /**
   * Journal API
   */
  journal: IFoundryGameJournalAPI;
}

/**
 * Interface for Foundry's settings API
 */
export interface IFoundrySettingsAPI {
  /**
   * Register a new setting
   * @param namespace - Module namespace
   * @param key - Setting key
   * @param config - Setting configuration
   */
  register<T>(namespace: string, key: string, config: SettingConfig<T>): void;

  /**
   * Get a setting value
   * @param namespace - Module namespace
   * @param key - Setting key
   * @returns Setting value or undefined
   */
  get<T>(namespace: string, key: string): T | undefined;

  /**
   * Set a setting value
   * @param namespace - Module namespace
   * @param key - Setting key
   * @param value - New value
   * @returns Promise that resolves when setting is saved
   */
  set(namespace: string, key: string, value: unknown): Promise<void>;
}

/**
 * Interface for Foundry's UI notifications API
 */
export interface IFoundryUINotificationsAPI {
  /**
   * Show an info notification
   * @param message - Notification message
   * @param options - Notification options
   */
  info(message: string, options?: FoundryNotificationOptions): void;

  /**
   * Show a warning notification
   * @param message - Notification message
   * @param options - Notification options
   */
  warn(message: string, options?: FoundryNotificationOptions): void;

  /**
   * Show an error notification
   * @param message - Notification message
   * @param options - Notification options
   */
  error(message: string, options?: FoundryNotificationOptions): void;
}

/**
 * Interface for Foundry's UI sidebar API
 */
export interface IFoundryUISidebarAPI {
  /**
   * Sidebar tabs
   */
  tabs?: {
    /**
     * Journal tab
     */
    journal?: {
      /**
       * Render the journal tab
       * @param force - Force re-render
       */
      render?: (force: boolean) => void;
    };
  };
}

/**
 * Interface for Foundry's UI API
 */
export interface IFoundryUIAPI {
  /**
   * Notifications API
   */
  notifications: IFoundryUINotificationsAPI;

  /**
   * Sidebar API
   */
  sidebar?: IFoundryUISidebarAPI;
}

/**
 * Interface for Foundry's Hooks API
 */
export interface IFoundryHooksAPI {
  /**
   * Register a hook callback
   * @param hookName - Hook name
   * @param callback - Callback function
   * @returns Hook ID
   */
  on(hookName: string, callback: FoundryHookCallback): number;

  /**
   * Register a one-time hook callback
   * @param hookName - Hook name
   * @param callback - Callback function
   * @returns Hook ID
   */
  once(hookName: string, callback: FoundryHookCallback): number;

  /**
   * Unregister a hook callback
   * @param hookName - Hook name
   * @param callbackOrId - Callback function or hook ID
   */
  off(hookName: string, callbackOrId: FoundryHookCallback | number): void;
}

/**
 * Interface for Foundry's i18n API
 */
export interface IFoundryI18nAPI {
  /**
   * Localize a translation key
   * @param key - Translation key
   * @returns Localized string (or key if not found)
   */
  localize(key: string): string;

  /**
   * Format a translation key with placeholders
   * @param key - Translation key
   * @param data - Placeholder values
   * @returns Formatted string
   */
  format(key: string, data: Record<string, string>): string;

  /**
   * Check if a translation key exists
   * @param key - Translation key
   * @returns True if key exists
   */
  has(key: string): boolean;
}

/**
 * Interface for Foundry's document API (for querySelector)
 */
export interface IFoundryDocumentAPI {
  /**
   * Query selector for DOM elements
   * @param selector - CSS selector
   * @returns Element or null
   */
  querySelector(selector: string): HTMLElement | null;
}

/**
 * Components of a parsed Foundry UUID
 */
export interface UuidComponents {
  type: string;
  documentName: string;
  documentId: string;
  pack?: string | undefined;
}

/**
 * Interface for Foundry's utils API
 *
 * Wraps Foundry VTT's `foundry.utils.*` functions to enable:
 * - Dependency injection for testability
 * - Result-pattern instead of exceptions
 * - Type-safe error handling
 */
/**
 * Resolved UUID from Foundry's parseUuid function.
 * Extracted to match actual Foundry API return type.
 */
export interface ResolvedUUID {
  uuid: string;
  collection: unknown;
  documentId: string;
  documentType: string;
  doc: unknown | null;
  embedded: string[];
}

export interface IFoundryUtilsAPI {
  // UUID & Dokument-Handling
  randomID(): string;
  fromUuid(uuid: string): Promise<unknown | null>;
  fromUuidSync(uuid: string): unknown | null;
  parseUuid(uuid: string, options?: { relative?: unknown }): ResolvedUUID | null;
  buildUuid(context: {
    documentName?: string;
    id: string;
    pack?: null | string;
    parent?: null | unknown;
  }): string | null;

  // Objekt-Manipulation
  deepClone<T>(obj: T): T;
  mergeObject<T>(original: T, updates: unknown, options?: unknown): T;
  diffObject(original: object, updated: object): Record<string, unknown>;
  flattenObject(obj: object): Record<string, unknown>;
  expandObject(obj: Record<string, unknown>): unknown;

  // HTML
  cleanHTML(html: string): string;
  escapeHTML(str: string): string;
  unescapeHTML(str: string): string;

  // Async/Timeout
  fetchWithTimeout(
    url: string,
    data?: RequestInit,
    options?: { onTimeout?: () => void; timeoutMs?: null | number }
  ): Promise<Response>;
  fetchJsonWithTimeout(
    url: string,
    data?: RequestInit,
    options?: { onTimeout?: () => void; timeoutMs?: null | number }
  ): Promise<unknown>;
}

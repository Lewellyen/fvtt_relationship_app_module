/**
 * Platform-agnostic types for notification operations.
 *
 * These types are shared across notification-related interfaces to avoid circular dependencies.
 */

/**
 * Platform-agnostic error for notification operations.
 */
export interface PlatformNotificationError {
  code: string;
  message: string;
  operation?: string;
  details?: unknown;
}

/**
 * Platform-agnostic options for notifications.
 *
 * NOTE: Platform-specific options (e.g., FoundryNotificationOptions) are handled
 * internally by adapters via type guards. This keeps the domain layer clean.
 */
export interface PlatformNotificationOptions {
  channels?: string[];
  traceId?: string;
  // Platform-specific options are handled by adapters, not exposed here
}

import type { Result } from "@/domain/types/result";

/**
 * Generic port for platform event systems.
 *
 * Platform-agnostic abstraction over event registration systems like:
 * - Foundry VTT Hooks
 * - Roll20 on:change events
 * - Fantasy Grounds event listeners
 * - File system polling
 *
 * @template TEvent - The event type this port handles
 */
export interface PlatformEventPort<TEvent> {
  /**
   * Register a listener for platform events.
   *
   * @param eventType - Generic event identifier
   * @param callback - Callback to execute when event fires
   * @returns Registration ID for cleanup
   */
  registerListener(
    eventType: string,
    callback: (event: TEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Unregister a previously registered listener.
   *
   * @param registrationId - ID returned from registerListener()
   * @returns Success or error
   */
  unregisterListener(registrationId: EventRegistrationId): Result<void, PlatformEventError>;
}

/**
 * Unique identifier for event registrations.
 * Allows cleanup of specific listeners.
 */
export type EventRegistrationId = string | number;

/**
 * Platform-agnostic event error.
 */
export interface PlatformEventError {
  code:
    | "EVENT_REGISTRATION_FAILED"
    | "EVENT_UNREGISTRATION_FAILED"
    | "INVALID_EVENT_TYPE"
    | "PLATFORM_NOT_AVAILABLE"
    | "API_NOT_AVAILABLE"
    | "OPERATION_FAILED";
  message: string;
  details?: unknown;
}

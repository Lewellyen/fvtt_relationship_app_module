import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { notificationCenterToken, consoleChannelToken, uiChannelToken } from "@/tokens/tokenindex";
import { DINotificationCenter } from "@/notifications/NotificationCenter";
import { ConsoleChannel } from "@/notifications/channels/ConsoleChannel";
import { UIChannel } from "@/notifications/channels/UIChannel";

/**
 * Registers notification services and channels.
 *
 * **Architecture:**
 * 1. Register Channels (ConsoleChannel, UIChannel) als Singletons
 * 2. Register NotificationCenter via DI-Wrapper (erhält Channels injiziert)
 *
 * **Channel Flow:**
 * NotificationCenter → [ConsoleChannel, UIChannel, ...]
 *
 * **Extensibility:**
 * Add new channels by:
 * 1. Creating a new class implementing NotificationChannel
 * 2. Registering it here as singleton
 * 3. Adding it to the NotificationCenter factory array
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerNotifications(container: ServiceContainer): Result<void, string> {
  // Register ConsoleChannel
  const consoleChannelResult = container.registerClass(
    consoleChannelToken,
    ConsoleChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(consoleChannelResult)) {
    return err(`Failed to register ConsoleChannel: ${consoleChannelResult.error.message}`);
  }

  // Register UIChannel
  const uiChannelResult = container.registerClass(
    uiChannelToken,
    UIChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiChannelResult)) {
    return err(`Failed to register UIChannel: ${uiChannelResult.error.message}`);
  }

  // Register NotificationCenter as singleton (channels injected via DI)
  const notificationCenterResult = container.registerClass(
    notificationCenterToken,
    DINotificationCenter,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(notificationCenterResult)) {
    return err(`Failed to register NotificationCenter: ${notificationCenterResult.error.message}`);
  }

  return ok(undefined);
}

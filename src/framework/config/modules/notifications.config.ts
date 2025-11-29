import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  notificationCenterToken,
  consoleChannelToken,
  uiChannelToken,
  platformNotificationPortToken,
} from "@/infrastructure/shared/tokens";
import { DINotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import { DIConsoleChannel } from "@/infrastructure/notifications/channels/ConsoleChannel";
import { DIUIChannel } from "@/infrastructure/notifications/channels/UIChannel";
import { DINotificationPortAdapter } from "@/infrastructure/adapters/notifications/platform-notification-port-adapter";

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
    DIConsoleChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(consoleChannelResult)) {
    return err(`Failed to register ConsoleChannel: ${consoleChannelResult.error.message}`);
  }

  // Register UIChannel
  const uiChannelResult = container.registerClass(
    uiChannelToken,
    DIUIChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiChannelResult)) {
    return err(`Failed to register UIChannel: ${uiChannelResult.error.message}`);
  }

  // Register NotificationCenter as singleton (initially nur ConsoleChannel)
  const notificationCenterResult = container.registerClass(
    notificationCenterToken,
    DINotificationCenter,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(notificationCenterResult)) {
    return err(`Failed to register NotificationCenter: ${notificationCenterResult.error.message}`);
  }

  // Register PlatformNotificationPort
  const notificationPortResult = container.registerClass(
    platformNotificationPortToken,
    DINotificationPortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(notificationPortResult)) {
    return err(
      `Failed to register PlatformNotificationPort: ${notificationPortResult.error.message}`
    );
  }

  // Hinweis: Zusätzliche Channels (z. B. UIChannel) werden erst nach dem Init-Hook
  // via notificationCenter.addChannel(...) angebunden.

  return ok(undefined);
}

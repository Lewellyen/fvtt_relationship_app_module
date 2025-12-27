import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { notificationCenterToken } from "@/application/tokens/notifications/notification-center.token";
import { consoleChannelToken } from "@/application/tokens/notifications/console-channel.token";
import { uiChannelToken } from "@/application/tokens/notifications/ui-channel.token";
import { queuedUIChannelToken } from "@/application/tokens/notifications/queued-ui-channel.token";
import {
  platformNotificationPortToken,
  notificationPublisherPortToken,
  notificationChannelRegistryPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { platformUIAvailabilityPortToken } from "@/application/tokens/domain-ports.tokens";
import { notificationQueueToken } from "@/infrastructure/shared/tokens/notifications/notification-queue.token";
import { DINotificationCenter } from "@/application/services/NotificationCenter";
import { DIConsoleChannel } from "@/infrastructure/notifications/channels/ConsoleChannel";
import { DIUIChannel } from "@/infrastructure/notifications/channels/UIChannel";
import { DIQueuedUIChannel } from "@/infrastructure/notifications/channels/QueuedUIChannel";
import { DINotificationPortAdapter } from "@/infrastructure/adapters/notifications/platform-notification-port-adapter";
import { DINotificationQueue } from "@/infrastructure/notifications/NotificationQueue";
import { DIFoundryUIAvailabilityPort } from "@/infrastructure/adapters/foundry/services/FoundryUIAvailabilityPort";

/**
 * Registers notification services and channels.
 *
 * **Architecture:**
 * 1. Register NotificationQueue (for queuing notifications before UI is available)
 * 2. Register PlatformUIAvailabilityPort (for checking UI availability)
 * 3. Register Channels (ConsoleChannel, UIChannel, QueuedUIChannel) als Singletons
 * 4. Register NotificationCenter via DI-Wrapper (erhält Channels injiziert)
 *
 * **Channel Flow:**
 * NotificationCenter → [ConsoleChannel, QueuedUIChannel, ...]
 * QueuedUIChannel → [Queue] → UIChannel (when UI available)
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
  // Register NotificationQueue (required by QueuedUIChannel)
  const notificationQueueResult = container.registerClass(
    notificationQueueToken,
    DINotificationQueue,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(notificationQueueResult)) {
    return err(`Failed to register NotificationQueue: ${notificationQueueResult.error.message}`);
  }

  // Register PlatformUIAvailabilityPort (required by QueuedUIChannel)
  const uiAvailabilityResult = container.registerClass(
    platformUIAvailabilityPortToken,
    DIFoundryUIAvailabilityPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiAvailabilityResult)) {
    return err(
      `Failed to register PlatformUIAvailabilityPort: ${uiAvailabilityResult.error.message}`
    );
  }

  // Register ConsoleChannel
  const consoleChannelResult = container.registerClass(
    consoleChannelToken,
    DIConsoleChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(consoleChannelResult)) {
    return err(`Failed to register ConsoleChannel: ${consoleChannelResult.error.message}`);
  }

  // Register UIChannel (required by QueuedUIChannel)
  const uiChannelResult = container.registerClass(
    uiChannelToken,
    DIUIChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiChannelResult)) {
    return err(`Failed to register UIChannel: ${uiChannelResult.error.message}`);
  }

  // Register QueuedUIChannel (wraps UIChannel with queue functionality)
  const queuedUIChannelResult = container.registerClass(
    queuedUIChannelToken,
    DIQueuedUIChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(queuedUIChannelResult)) {
    return err(`Failed to register QueuedUIChannel: ${queuedUIChannelResult.error.message}`);
  }

  // Register NotificationCenter as singleton (with ConsoleChannel and UIChannel)
  const notificationCenterResult = container.registerClass(
    notificationCenterToken,
    DINotificationCenter,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(notificationCenterResult)) {
    return err(`Failed to register NotificationCenter: ${notificationCenterResult.error.message}`);
  }

  // Register PlatformNotificationPort (full interface)
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

  // Register NotificationPublisherPort (ISP-compliant: only publishing methods)
  // Binds to the same adapter class as PlatformNotificationPort
  // Since PlatformNotificationPort extends NotificationPublisherPort, the adapter implements both
  const publisherPortResult = container.registerClass(
    notificationPublisherPortToken,
    DINotificationPortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(publisherPortResult)) {
    return err(
      `Failed to register NotificationPublisherPort: ${publisherPortResult.error.message}`
    );
  }

  // Register NotificationChannelRegistryPort (ISP-compliant: only channel management methods)
  // Binds to the same adapter class as PlatformNotificationPort
  // Since PlatformNotificationPort extends NotificationChannelRegistryPort, the adapter implements both
  const channelRegistryPortResult = container.registerClass(
    notificationChannelRegistryPortToken,
    DINotificationPortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(channelRegistryPortResult)) {
    return err(
      `Failed to register NotificationChannelRegistryPort: ${channelRegistryPortResult.error.message}`
    );
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "Notifications",
  priority: 130,
  execute: registerNotifications,
});

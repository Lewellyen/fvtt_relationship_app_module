import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import { createPublicNotificationCenter } from "../../public-api-wrappers";

/**
 * NotificationWrapperStrategy
 *
 * Strategy for wrapping NotificationCenter with read-only wrapper.
 * Only allows debug, info, warn, error, and getChannelNames methods.
 */
export class NotificationWrapperStrategy implements ApiWrapperStrategy<PlatformNotificationPort> {
  supports(
    token: ApiSafeToken<PlatformNotificationPort>,
    wellKnownTokens: ModuleApiTokens
  ): boolean {
    return token === wellKnownTokens.platformNotificationPortToken;
  }

  wrap(
    service: PlatformNotificationPort,
    _token: ApiSafeToken<PlatformNotificationPort>,
    _wellKnownTokens: ModuleApiTokens
  ): PlatformNotificationPort {
    return createPublicNotificationCenter(service);
  }

  getPriority(): number {
    return 10; // High priority for specific token match
  }
}

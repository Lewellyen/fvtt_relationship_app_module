import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";
import type { NotificationService } from "@/application/services/notification-center.interface";
import { createPublicNotificationCenter } from "../../public-api-wrappers";
import { wrapNotificationCenterService } from "@/infrastructure/di/types/utilities/api-casts";

/**
 * NotificationWrapperStrategy
 *
 * Strategy for wrapping NotificationCenter with read-only wrapper.
 * Only allows debug, info, warn, error, and getChannelNames methods.
 */
export class NotificationWrapperStrategy implements ApiWrapperStrategy<NotificationService> {
  supports(token: ApiSafeToken<NotificationService>, wellKnownTokens: ModuleApiTokens): boolean {
    return token === wellKnownTokens.notificationCenterToken;
  }

  wrap(
    service: NotificationService,
    _token: ApiSafeToken<NotificationService>,
    _wellKnownTokens: ModuleApiTokens
  ): NotificationService {
    return wrapNotificationCenterService(service, createPublicNotificationCenter);
  }

  getPriority(): number {
    return 10; // High priority for specific token match
  }
}

import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import { createPublicLogger } from "../../public-api-wrappers";

/**
 * LoggingWrapperStrategy
 *
 * Wraps PlatformLoggingPort as read-only to prevent external modules from changing
 * logger configuration (e.g. setMinLevel()).
 */
export class LoggingWrapperStrategy implements ApiWrapperStrategy<PlatformLoggingPort> {
  supports(token: ApiSafeToken<PlatformLoggingPort>, wellKnownTokens: ModuleApiTokens): boolean {
    return token === wellKnownTokens.platformLoggingPortToken;
  }

  wrap(
    service: PlatformLoggingPort,
    _token: ApiSafeToken<PlatformLoggingPort>,
    _wellKnownTokens: ModuleApiTokens
  ): PlatformLoggingPort {
    return createPublicLogger(service);
  }

  getPriority(): number {
    return 10;
  }
}

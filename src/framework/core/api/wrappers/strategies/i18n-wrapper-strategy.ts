import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import { createPublicI18n } from "../../public-api-wrappers";

/**
 * I18nWrapperStrategy
 *
 * Strategy for wrapping I18nFacadeService with read-only wrapper.
 * Only allows translate, format, and has methods.
 */
export class I18nWrapperStrategy implements ApiWrapperStrategy<PlatformI18nPort> {
  supports(token: ApiSafeToken<PlatformI18nPort>, wellKnownTokens: ModuleApiTokens): boolean {
    return token === wellKnownTokens.platformI18nPortToken;
  }

  wrap(
    service: PlatformI18nPort,
    _token: ApiSafeToken<PlatformI18nPort>,
    _wellKnownTokens: ModuleApiTokens
  ): PlatformI18nPort {
    return createPublicI18n(service);
  }

  getPriority(): number {
    return 10; // High priority for specific token match
  }
}

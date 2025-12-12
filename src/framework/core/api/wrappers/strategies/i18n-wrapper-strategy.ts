import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import { createPublicI18n } from "../../public-api-wrappers";
import { wrapI18nService } from "@/infrastructure/di/types/utilities/api-casts";

/**
 * I18nWrapperStrategy
 *
 * Strategy for wrapping I18nFacadeService with read-only wrapper.
 * Only allows translate, format, and has methods.
 */
export class I18nWrapperStrategy implements ApiWrapperStrategy<I18nFacadeService> {
  supports(token: ApiSafeToken<I18nFacadeService>, wellKnownTokens: ModuleApiTokens): boolean {
    return token === wellKnownTokens.i18nFacadeToken;
  }

  wrap(
    service: I18nFacadeService,
    _token: ApiSafeToken<I18nFacadeService>,
    _wellKnownTokens: ModuleApiTokens
  ): I18nFacadeService {
    return wrapI18nService(service, createPublicI18n);
  }

  getPriority(): number {
    return 10; // High priority for specific token match
  }
}

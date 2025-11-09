import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { foundryI18nToken, localI18nToken, i18nFacadeToken } from "@/tokens/tokenindex";
import { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import { LocalI18nService } from "@/services/LocalI18nService";
import { I18nFacadeService } from "@/services/I18nFacadeService";

/**
 * Registers internationalization (i18n) services.
 *
 * Services registered:
 * - FoundryI18nService (singleton) - Wraps Foundry's i18n system
 * - LocalI18nService (singleton) - Local translations
 * - I18nFacadeService (singleton) - Facade combining both sources
 *
 * I18nFacadeService provides a unified interface for translations,
 * falling back from Foundry to local translations.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerI18nServices(container: ServiceContainer): Result<void, string> {
  // Register FoundryI18nService
  const foundryI18nResult = container.registerClass(
    foundryI18nToken,
    FoundryI18nService,
    ServiceLifecycle.SINGLETON
  );
  /* c8 ignore start -- Defensive: Service registration */
  if (isErr(foundryI18nResult)) {
    return err(`Failed to register FoundryI18nService: ${foundryI18nResult.error.message}`);
  }
  /* c8 ignore stop */

  // Register LocalI18nService
  const localI18nResult = container.registerClass(
    localI18nToken,
    LocalI18nService,
    ServiceLifecycle.SINGLETON
  );
  /* c8 ignore start -- Defensive: Service registration */
  if (isErr(localI18nResult)) {
    return err(`Failed to register LocalI18nService: ${localI18nResult.error.message}`);
  }
  /* c8 ignore stop */

  // Register I18nFacadeService
  const facadeResult = container.registerClass(
    i18nFacadeToken,
    I18nFacadeService,
    ServiceLifecycle.SINGLETON
  );
  /* c8 ignore start -- Defensive: Service registration */
  if (isErr(facadeResult)) {
    return err(`Failed to register I18nFacadeService: ${facadeResult.error.message}`);
  }
  /* c8 ignore stop */

  return ok(undefined);
}

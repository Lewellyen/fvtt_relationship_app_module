import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { Result } from "@/domain/types/result";
import { i18nFacadeToken } from "@/infrastructure/shared/tokens";

/**
 * Adapter that implements PlatformI18nPort by wrapping I18nFacadeService.
 *
 * Simple 1:1 mapping since I18nFacadeService is already platform-agnostic.
 */
export class I18nPortAdapter implements PlatformI18nPort {
  constructor(private readonly i18nFacade: I18nFacadeService) {}

  translate(key: string, fallback?: string): Result<string, string> {
    return this.i18nFacade.translate(key, fallback);
  }

  format(key: string, data: Record<string, unknown>, fallback?: string): Result<string, string> {
    return this.i18nFacade.format(key, data, fallback);
  }

  has(key: string): Result<boolean, string> {
    return this.i18nFacade.has(key);
  }

  loadLocalTranslations(translations: Record<string, string>): void {
    this.i18nFacade.loadLocalTranslations(translations);
  }
}

/**
 * DI-enabled wrapper for I18nPortAdapter.
 */
export class DII18nPortAdapter extends I18nPortAdapter {
  static dependencies = [i18nFacadeToken] as const;

  constructor(i18nFacade: I18nFacadeService) {
    super(i18nFacade);
  }
}

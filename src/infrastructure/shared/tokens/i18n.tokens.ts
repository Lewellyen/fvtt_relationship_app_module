/**
 * Internationalization (i18n) tokens for translation services and handlers.
 *
 * WICHTIG: I18nFacadeService Type-Import entfernt, um Zyklus zu vermeiden!
 * Token-Generics werden beim resolve() aufgelöst.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryI18nPort } from "@/infrastructure/adapters/foundry/services/FoundryI18nPort";
import type { LocalI18nService } from "@/infrastructure/i18n/LocalI18nService";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";

/**
 * Injection token for the FoundryI18nPort.
 *
 * Provides access to Foundry VTT's i18n API via Port-Adapter pattern.
 * Automatically selects the correct port based on Foundry version.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(foundryI18nToken);
 * const result = i18n.localize("MODULE.SETTINGS.logLevel.name");
 * if (result.ok) {
 *   console.log(result.value);
 * }
 * ```
 */
export const foundryI18nToken = createInjectionToken<FoundryI18nPort>("FoundryI18nPort");

/**
 * Injection token for the LocalI18nService.
 *
 * Provides Foundry-independent JSON-based translations.
 * Used as fallback when Foundry's i18n is unavailable.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(localI18nToken);
 * const result = i18n.translate("MODULE.SETTINGS.logLevel.name");
 * console.log(result.value);
 * ```
 */
export const localI18nToken = createInjectionToken<LocalI18nService>("LocalI18nService");

/**
 * Injection token for the I18nFacadeService.
 *
 * Combines Foundry's i18n and local translations with intelligent fallback.
 * This is the recommended token to use for all internationalization needs.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 * Dies verhindert Zyklus: i18n.tokens ↔ I18nFacadeService
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(i18nFacadeToken);
 * const text = i18n.translate("MODULE.SETTINGS.logLevel.name", "Log Level");
 * console.log(text);
 * ```
 */
export const i18nFacadeToken = createInjectionToken<any>("I18nFacadeService");

/**
 * Injection token for the FoundryTranslationHandler.
 *
 * First handler in the translation chain: tries Foundry's i18n first.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const foundryTranslationHandlerToken = createInjectionToken<TranslationHandler>(
  "FoundryTranslationHandler"
);

/**
 * Injection token for the LocalTranslationHandler.
 *
 * Second handler in the translation chain: provides local JSON-based translations.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const localTranslationHandlerToken =
  createInjectionToken<TranslationHandler>("LocalTranslationHandler");

/**
 * Injection token for the FallbackTranslationHandler.
 *
 * Final handler in the translation chain: returns fallback or key itself.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const fallbackTranslationHandlerToken = createInjectionToken<TranslationHandler>(
  "FallbackTranslationHandler"
);

/**
 * Injection token for the TranslationHandlerChain.
 *
 * Fully configured chain: Foundry → Local → Fallback.
 * Built via factory in DI container.
 */
export const translationHandlerChainToken =
  createInjectionToken<TranslationHandler>("TranslationHandlerChain");

/**
 * Injection token for array of TranslationHandler instances.
 *
 * Allows multiple handlers to be registered and composed via DI.
 * Handlers are chained in the order they appear in the array.
 */
export const translationHandlersToken =
  createInjectionToken<TranslationHandler[]>("TranslationHandlers");

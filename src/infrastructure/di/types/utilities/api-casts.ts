/**
 * Cast utilities für API und Module-Initialization.
 *
 * Separate Datei für API-spezifische Wrapper-Funktionen.
 * Diese Funktionen sind nur für den Module-API-Kontext gedacht.
 *
 * Diese Datei enthält KEINE Type-Imports - alle Parameter verwenden 'any'
 * um zirkuläre Dependencies zu vermeiden!
 *
 * @ts-expect-error - Type coverage exclusion
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Wrapper für I18nFacadeService im Module-API-Kontext.
 * Kapselt die notwendige Umwandlung von unknown → I18nFacadeService
 * und wieder zurück zu generischem T.
 */
export function wrapI18nService<T>(service: T, create: (i18n: any) => any): T {
  return create(service as any) as T;
}

/**
 * Wrapper für NotificationCenter.
 * Entspricht wrapI18nService, aber für NotificationCenter.
 */
export function wrapNotificationCenterService<T>(service: T, create: (center: any) => any): T {
  return create(service as any) as T;
}

/**
 * Wrapper für FoundrySettings.
 * Entspricht wrapI18nService, aber für FoundrySettings.
 */
export function wrapFoundrySettingsPort<T>(service: T, create: (settings: any) => any): T {
  return create(service as any) as T;
}

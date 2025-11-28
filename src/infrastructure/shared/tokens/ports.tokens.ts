import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { BootstrapHooksPort } from "@/domain/ports/bootstrap-hooks-port.interface";
import type { SettingsRegistrationPort } from "@/domain/ports/settings-registration-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";

/**
 * DI Token for PlatformUIPort.
 *
 * Platform-agnostic UI operations port.
 * Default implementation: FoundryUIAdapter (for Foundry VTT)
 */
export const platformUIPortToken = createInjectionToken<PlatformUIPort>("PlatformUIPort");

/**
 * DI Token for PlatformSettingsPort.
 *
 * Platform-agnostic settings port.
 * Default implementation: FoundrySettingsAdapter (for Foundry VTT)
 */
export const platformSettingsPortToken =
  createInjectionToken<PlatformSettingsPort>("PlatformSettingsPort");

/**
 * DI Token for BootstrapHooksPort.
 *
 * Platform-agnostic bootstrap lifecycle hooks port.
 * Used for registering init/ready callbacks during module bootstrap.
 *
 * CRITICAL: This port uses direct platform APIs (e.g., Foundry Hooks.on())
 * because the full event system requires version detection which may not
 * be available before the init hook runs.
 *
 * Default implementation: FoundryBootstrapHooksAdapter (for Foundry VTT)
 */
export const bootstrapHooksPortToken =
  createInjectionToken<BootstrapHooksPort>("BootstrapHooksPort");

/**
 * DI Token for SettingsRegistrationPort.
 *
 * Domain-neutral settings port that doesn't expose Valibot schemas.
 * Uses validator functions instead of schemas for type safety.
 *
 * This port is preferred over PlatformSettingsPort when the caller
 * doesn't need Valibot schema validation (e.g., in application layer).
 *
 * Default implementation: FoundrySettingsRegistrationAdapter (for Foundry VTT)
 */
export const settingsRegistrationPortToken = createInjectionToken<SettingsRegistrationPort>(
  "SettingsRegistrationPort"
);

/**
 * DI Token for PlatformNotificationPort.
 *
 * Platform-agnostic notification port.
 * Default implementation: NotificationPortAdapter (wraps NotificationCenter)
 */
export const platformNotificationPortToken = createInjectionToken<PlatformNotificationPort>(
  "PlatformNotificationPort"
);

/**
 * DI Token for PlatformCachePort.
 *
 * Platform-agnostic cache port.
 * Default implementation: CachePortAdapter (wraps CacheService)
 */
export const platformCachePortToken = createInjectionToken<PlatformCachePort>("PlatformCachePort");

/**
 * DI Token for PlatformI18nPort.
 *
 * Platform-agnostic i18n port.
 * Default implementation: I18nPortAdapter (wraps I18nFacadeService)
 */
export const platformI18nPortToken = createInjectionToken<PlatformI18nPort>("PlatformI18nPort");

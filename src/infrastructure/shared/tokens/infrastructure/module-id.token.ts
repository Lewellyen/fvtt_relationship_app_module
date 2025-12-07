/**
 * Injection token for the module ID.
 *
 * WICHTIG: Diese Datei importiert KEINE Service-Types!
 * Token-Generics werden erst beim resolve() aufgelöst.
 * Dies verhindert zirkuläre Dependencies strukturell.
 */

import { createInjectionToken } from "@/infrastructure/di/token-factory";

/**
 * Injection token for the module ID.
 *
 * Provides the module identifier string for Infrastructure services.
 * Registered as a static value in static-values.config.ts to avoid
 * Infrastructure layer depending on Application layer constants.
 */
export const moduleIdToken = createInjectionToken<string>("ModuleId");

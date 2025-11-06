/**
 * Injection tokens for the Foundry abstraction layer and its versioned ports.
 * These tokens allow services to be resolved via the DI container without
 * directly depending on concrete implementations.
 */
import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import { createInjectionToken } from "@/di_infrastructure/tokenutilities";
import type { FoundryGame } from "./interfaces/FoundryGame";
import type { FoundryHooks } from "./interfaces/FoundryHooks";
import type { FoundryDocument } from "./interfaces/FoundryDocument";
import type { FoundryUI } from "./interfaces/FoundryUI";
import type { FoundrySettings } from "./interfaces/FoundrySettings";
import type { FoundryI18n } from "./interfaces/FoundryI18n";
import type { PortSelector } from "./versioning/portselector";
import type { PortRegistry } from "./versioning/portregistry";

/**
 * Injection token for FoundryGame service.
 *
 * Provides access to Foundry's game API, specifically journal entries.
 * Automatically selects version-appropriate port implementation.
 *
 * @example
 * ```typescript
 * const game = container.resolve(foundryGameToken);
 * const entries = game.getJournalEntries();
 * if (entries.ok) {
 *   console.log(`Found ${entries.value.length} journal entries`);
 * }
 * ```
 */
export const foundryGameToken: InjectionToken<FoundryGame> =
  createInjectionToken<FoundryGame>("FoundryGame");

/**
 * Injection token for FoundryHooks service.
 *
 * Provides access to Foundry's hook system for event registration.
 * Automatically selects version-appropriate port implementation.
 *
 * @example
 * ```typescript
 * const hooks = container.resolve(foundryHooksToken);
 * hooks.on("renderJournalDirectory", (app, html) => {
 *   console.log("Journal directory rendered");
 * });
 * ```
 */
export const foundryHooksToken: InjectionToken<FoundryHooks> =
  createInjectionToken<FoundryHooks>("FoundryHooks");

/**
 * Injection token for FoundryDocument service.
 *
 * Provides access to Foundry's document API for flag management.
 * Automatically selects version-appropriate port implementation.
 *
 * @example
 * ```typescript
 * const doc = container.resolve(foundryDocumentToken);
 * const flag = doc.getFlag(journal, "my-module", "my-flag");
 * if (flag.ok) {
 *   console.log("Flag value:", flag.value);
 * }
 * ```
 */
export const foundryDocumentToken: InjectionToken<FoundryDocument> =
  createInjectionToken<FoundryDocument>("FoundryDocument");

/**
 * Injection token for FoundryUI service.
 *
 * Provides access to Foundry's UI manipulation API for notifications
 * and DOM element management.
 *
 * @example
 * ```typescript
 * const ui = container.resolve(foundryUIToken);
 * ui.notify("Operation successful", "info");
 * ```
 */
export const foundryUIToken: InjectionToken<FoundryUI> =
  createInjectionToken<FoundryUI>("FoundryUI");

/**
 * Injection token for PortSelector.
 *
 * Selects the appropriate port implementation based on the current
 * Foundry VTT version. Uses factory-based selection to prevent crashes
 * from incompatible port constructors.
 *
 * @remarks
 * This is a core infrastructure service used internally by Foundry services.
 * Typically not accessed directly by application code.
 */
export const portSelectorToken: InjectionToken<PortSelector> =
  createInjectionToken<PortSelector>("PortSelector");

/**
 * Injection token for FoundryGame PortRegistry.
 */
export const foundryGamePortRegistryToken: InjectionToken<PortRegistry<FoundryGame>> =
  createInjectionToken<PortRegistry<FoundryGame>>("FoundryGamePortRegistry");

/**
 * Injection token for FoundryHooks PortRegistry.
 */
export const foundryHooksPortRegistryToken: InjectionToken<PortRegistry<FoundryHooks>> =
  createInjectionToken<PortRegistry<FoundryHooks>>("FoundryHooksPortRegistry");

/**
 * Injection token for FoundryDocument PortRegistry.
 */
export const foundryDocumentPortRegistryToken: InjectionToken<PortRegistry<FoundryDocument>> =
  createInjectionToken<PortRegistry<FoundryDocument>>("FoundryDocumentPortRegistry");

/**
 * Injection token for FoundryUI PortRegistry.
 */
export const foundryUIPortRegistryToken: InjectionToken<PortRegistry<FoundryUI>> =
  createInjectionToken<PortRegistry<FoundryUI>>("FoundryUIPortRegistry");

/**
 * Injection token for FoundrySettings service.
 *
 * Provides access to Foundry's settings system for module configuration.
 * Automatically selects version-appropriate port implementation.
 *
 * @example
 * ```typescript
 * const settings = container.resolve(foundrySettingsToken);
 * const logLevel = settings.get("my-module", "logLevel");
 * if (logLevel.ok) {
 *   console.log("Current log level:", logLevel.value);
 * }
 * ```
 */
export const foundrySettingsToken: InjectionToken<FoundrySettings> =
  createInjectionToken<FoundrySettings>("FoundrySettings");

/**
 * Injection token for FoundrySettings PortRegistry.
 */
export const foundrySettingsPortRegistryToken: InjectionToken<PortRegistry<FoundrySettings>> =
  createInjectionToken<PortRegistry<FoundrySettings>>("FoundrySettingsPortRegistry");

/**
 * Injection token for FoundryI18n PortRegistry.
 */
export const foundryI18nPortRegistryToken: InjectionToken<PortRegistry<FoundryI18n>> =
  createInjectionToken<PortRegistry<FoundryI18n>>("FoundryI18nPortRegistry");

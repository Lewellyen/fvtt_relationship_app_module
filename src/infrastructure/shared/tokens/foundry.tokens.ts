/**
 * Injection tokens for the Foundry abstraction layer and its versioned ports.
 * These tokens allow services to be resolved via the DI container without
 * directly depending on concrete implementations.
 */
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryI18n } from "@/infrastructure/adapters/foundry/interfaces/FoundryI18n";
import type { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundryJournalFacade } from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade.interface";
import type { LibWrapperService } from "@/domain/services/lib-wrapper-service.interface";
import type { ContextMenuRegistrationPort } from "@/domain/ports/context-menu-registration-port.interface";
import type { JournalContextMenuLibWrapperService } from "@/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService";

/**
 * Injection token for FoundryGame port.
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
 * Injection token for FoundryHooks port.
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
 * Injection token for FoundryDocument port.
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
 * Injection token for FoundryUI port.
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
 * Injection token for FoundrySettings port.
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

/**
 * Version-specific port tokens for Foundry VTT v13.
 * These tokens are used to register and resolve version-specific port implementations
 * via the DI container, ensuring DIP (Dependency Inversion Principle) compliance.
 *
 * Ports are registered in the container during bootstrap and resolved by PortSelector
 * based on the current Foundry version.
 */

/**
 * Injection token for FoundryGame port v13 implementation.
 */
export const foundryV13GamePortToken: InjectionToken<FoundryGame> =
  createInjectionToken<FoundryGame>("FoundryV13GamePort");

/**
 * Injection token for FoundryHooks port v13 implementation.
 */
export const foundryV13HooksPortToken: InjectionToken<FoundryHooks> =
  createInjectionToken<FoundryHooks>("FoundryV13HooksPort");

/**
 * Injection token for FoundryDocument port v13 implementation.
 */
export const foundryV13DocumentPortToken: InjectionToken<FoundryDocument> =
  createInjectionToken<FoundryDocument>("FoundryV13DocumentPort");

/**
 * Injection token for FoundryUI port v13 implementation.
 */
export const foundryV13UIPortToken: InjectionToken<FoundryUI> =
  createInjectionToken<FoundryUI>("FoundryV13UIPort");

/**
 * Injection token for FoundrySettings port v13 implementation.
 */
export const foundryV13SettingsPortToken: InjectionToken<FoundrySettings> =
  createInjectionToken<FoundrySettings>("FoundryV13SettingsPort");

/**
 * Injection token for FoundryI18n port v13 implementation.
 */
export const foundryV13I18nPortToken: InjectionToken<FoundryI18n> =
  createInjectionToken<FoundryI18n>("FoundryV13I18nPort");

/**
 * Injection token for FoundryJournalFacade.
 *
 * Facade that combines FoundryGame, FoundryDocument, and FoundryUI
 * for journal-specific operations.
 *
 * **Benefits:**
 * - Reduces dependency count from 3 services to 1 facade
 * - Provides cohesive journal-specific API
 * - Easier to test and mock
 *
 * @example
 * ```typescript
 * const facade = container.resolve(foundryJournalFacadeToken);
 * const entries = facade.getJournalEntries();
 * if (entries.ok) {
 *   // Process entries
 * }
 * ```
 */
export const foundryJournalFacadeToken: InjectionToken<FoundryJournalFacade> =
  createInjectionToken<FoundryJournalFacade>("FoundryJournalFacade");

/**
 * Injection token for LibWrapperService.
 *
 * Provides a facade over libWrapper for registering and unregistering method wrappers.
 * Handles tracking of registrations and cleanup.
 *
 * @example
 * ```typescript
 * const libWrapper = container.resolve(libWrapperServiceToken);
 * const result = libWrapper.register(
 *   "foundry.applications.ux.ContextMenu.implementation.prototype.render",
 *   (wrapped, ...args) => {
 *     // Custom logic
 *     return wrapped(...args);
 *   },
 *   "WRAPPER"
 * );
 * ```
 */
export const libWrapperServiceToken: InjectionToken<LibWrapperService> =
  createInjectionToken<LibWrapperService>("LibWrapperService");

/**
 * Injection token for JournalContextMenuLibWrapperService.
 *
 * Service for managing libWrapper registration for journal context menu.
 * Handles the registration of the libWrapper wrapper function for the Foundry
 * ContextMenu.render method and manages callbacks that can modify context menu options.
 *
 * NOTE: This is NOT an event system. The libWrapper is registered once during init,
 * and callbacks are registered separately.
 *
 * @example
 * ```typescript
 * const service = container.resolve(journalContextMenuLibWrapperServiceToken);
 *
 * // Register libWrapper (called during init)
 * const result = service.register();
 *
 * // Add callback for handling context menu
 * service.addCallback((event) => {
 *   event.options.push({
 *     name: "Custom Option",
 *     icon: '<i class="fas fa-star"></i>',
 *     callback: () => { /* ... *\/ }
 *   });
 * });
 * ```
 */
export const journalContextMenuLibWrapperServiceToken: InjectionToken<JournalContextMenuLibWrapperService> =
  createInjectionToken<JournalContextMenuLibWrapperService>("JournalContextMenuLibWrapperService");

/**
 * Injection token for ContextMenuRegistrationPort.
 *
 * Platform-agnostic port for registering context menu callbacks.
 * Foundry implementation uses JournalContextMenuLibWrapperService.
 *
 * @example
 * ```typescript
 * const port = container.resolve(contextMenuRegistrationPortToken);
 * port.addCallback((event) => {
 *   event.options.push({ name: "Custom", icon: "...", callback: () => {} });
 * });
 * ```
 */
export const contextMenuRegistrationPortToken: InjectionToken<ContextMenuRegistrationPort> =
  createInjectionToken<ContextMenuRegistrationPort>("ContextMenuRegistrationPort");

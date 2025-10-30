import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import { createInjectionToken } from "@/di_infrastructure/tokenutilities";
import type { FoundryGame } from "./interfaces/FoundryGame";
import type { FoundryHooks } from "./interfaces/FoundryHooks";
import type { FoundryDocument } from "./interfaces/FoundryDocument";
import type { FoundryUI } from "./interfaces/FoundryUI";
import type { PortSelector } from "./versioning/portselector";
import type { PortRegistry } from "./versioning/portregistry";

/**
 * Injection token for FoundryGame service.
 */
export const foundryGameToken: InjectionToken<FoundryGame> =
  createInjectionToken<FoundryGame>("FoundryGame");

/**
 * Injection token for FoundryHooks service.
 */
export const foundryHooksToken: InjectionToken<FoundryHooks> =
  createInjectionToken<FoundryHooks>("FoundryHooks");

/**
 * Injection token for FoundryDocument service.
 */
export const foundryDocumentToken: InjectionToken<FoundryDocument> =
  createInjectionToken<FoundryDocument>("FoundryDocument");

/**
 * Injection token for FoundryUI service.
 */
export const foundryUIToken: InjectionToken<FoundryUI> =
  createInjectionToken<FoundryUI>("FoundryUI");

/**
 * Injection token for PortSelector.
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

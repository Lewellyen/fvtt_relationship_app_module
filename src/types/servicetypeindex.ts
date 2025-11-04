/**
 * Type definitions for all service types used in dependency injection.
 */
import type { Logger } from "@/interfaces/logger";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";

/**
 * Union type representing all registered service types in the application.
 * Add new service interfaces to this union as you create them.
 *
 * @example
 * ```typescript
 * // Add a new service:
 * export type ServiceType = Logger | Database | Cache;
 * ```
 */
export type ServiceType =
  | Logger
  | FoundryGame
  | FoundryHooks
  | FoundryDocument
  | FoundryUI
  | FoundrySettings
  | PortSelector
  | PortRegistry<FoundryGame>
  | PortRegistry<FoundryHooks>
  | PortRegistry<FoundryDocument>
  | PortRegistry<FoundryUI>
  | PortRegistry<FoundrySettings>
  | JournalVisibilityService;

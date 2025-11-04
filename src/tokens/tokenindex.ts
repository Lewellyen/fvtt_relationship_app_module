import { createInjectionToken } from "@/di_infrastructure/tokenutilities";
import type { Logger } from "@/interfaces/logger";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";

/**
 * Injection token for the application logger service.
 *
 * Resolves to ConsoleLoggerService, providing structured logging
 * with configurable log levels (DEBUG, INFO, WARN, ERROR).
 *
 * @example
 * ```typescript
 * const logger = container.resolve(loggerToken);
 * logger.info("Application started");
 * logger.error("Error occurred", { code: 500, details: error });
 * ```
 */
export const loggerToken = createInjectionToken<Logger>("Logger");

/**
 * Injection token for the JournalVisibilityService.
 *
 * Manages visibility of journal entries based on module flags.
 * Handles hiding/showing entries in the Foundry UI and processes
 * journal directory rendering.
 *
 * @example
 * ```typescript
 * const service = container.resolve(journalVisibilityServiceToken);
 * const hidden = service.getHiddenJournalEntries();
 * if (hidden.ok) {
 *   console.log(`Found ${hidden.value.length} hidden entries`);
 * }
 * ```
 */
export const journalVisibilityServiceToken = createInjectionToken<JournalVisibilityService>(
  "JournalVisibilityService"
);

/**
 * Re-export port-related tokens for convenience.
 * These are defined in @/foundry/foundrytokens but exported here for easier access.
 */
export { portSelectorToken } from "@/foundry/foundrytokens";

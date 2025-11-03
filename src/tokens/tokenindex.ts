import { createInjectionToken } from "@/di_infrastructure/tokenutilities";
import type { Logger } from "@/interfaces/logger";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";

/**
 * Token for resolving Logger service instances.
 * Used to inject logging functionality throughout the application.
 */
export const loggerToken = createInjectionToken<Logger>("Logger");

/**
 * Token for resolving the JournalVisibilityService.
 */
export const journalVisibilityServiceToken = createInjectionToken<JournalVisibilityService>(
  "JournalVisibilityService"
);

/**
 * Re-export port-related tokens for convenience.
 * These are defined in @/foundry/foundrytokens but exported here for easier access.
 */
export { portSelectorToken } from "@/foundry/foundrytokens";

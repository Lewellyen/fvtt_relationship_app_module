import { createInjectionToken } from "@/di_infrastructure/tokenutilities";
import type { Logger } from "@/interfaces/logger";

/**
 * Token for resolving Logger service instances.
 * Used to inject logging functionality throughout the application.
 */
export const loggerToken = createInjectionToken<Logger>("Logger");

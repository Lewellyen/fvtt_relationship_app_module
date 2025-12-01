/**
 * Utility function to create type-safe injection tokens for dependency injection.
 *
 * @deprecated This file is kept for backward compatibility.
 * New code should import from "@/infrastructure/shared/di" instead.
 * This re-export allows existing Infrastructure layer code to continue working
 * while Application layer code uses the shared location to avoid DIP violations.
 */
export { createInjectionToken } from "@/infrastructure/shared/di";

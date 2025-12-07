/**
 * Injection token for FoundryDocument port v13 implementation.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryV13DocumentPort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13DocumentPort";

/**
 * Injection token for FoundryDocument port v13 implementation.
 */
export const foundryV13DocumentPortToken =
  createInjectionToken<FoundryV13DocumentPort>("FoundryV13DocumentPort");

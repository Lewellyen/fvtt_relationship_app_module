/**
 * Injection token for FoundryUI port v13 implementation.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryV13UIPort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13UIPort";

/**
 * Injection token for FoundryUI port v13 implementation.
 */
export const foundryV13UIPortToken = createInjectionToken<FoundryV13UIPort>("FoundryV13UIPort");

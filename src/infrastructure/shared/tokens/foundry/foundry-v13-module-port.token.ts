/**
 * Injection token for FoundryModule port v13 implementation.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryV13ModulePort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13ModulePort";

/**
 * Injection token for FoundryModule port v13 implementation.
 */
export const foundryV13ModulePortToken =
  createInjectionToken<FoundryV13ModulePort>("FoundryV13ModulePort");

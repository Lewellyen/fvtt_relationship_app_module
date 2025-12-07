/**
 * Injection token for FoundryGame port v13 implementation.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryV13GamePort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13GamePort";

/**
 * Injection token for FoundryGame port v13 implementation.
 *
 * These tokens are used to register and resolve version-specific port implementations
 * via the DI container, ensuring DIP (Dependency Inversion Principle) compliance.
 *
 * Ports are registered in the container during bootstrap and resolved by PortSelector
 * based on the current Foundry version.
 */
export const foundryV13GamePortToken =
  createInjectionToken<FoundryV13GamePort>("FoundryV13GamePort");

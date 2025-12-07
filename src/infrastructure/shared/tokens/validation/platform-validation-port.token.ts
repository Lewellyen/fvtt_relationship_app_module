/**
 * DI Token for PlatformValidationPort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";

/**
 * DI Token for PlatformValidationPort.
 *
 * Platform-agnostic validation port.
 * Default implementation: ValibotValidationAdapter (uses Valibot library)
 */
export const platformValidationPortToken =
  createInjectionToken<PlatformValidationPort>("PlatformValidationPort");

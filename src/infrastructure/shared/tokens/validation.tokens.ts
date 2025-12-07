/**
 * Validation port tokens for dependency injection.
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

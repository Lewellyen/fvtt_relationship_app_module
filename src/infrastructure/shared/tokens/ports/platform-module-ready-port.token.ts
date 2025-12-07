/**
 * DI Token for PlatformModuleReadyPort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PlatformModuleReadyPort } from "@/domain/ports/platform-module-ready-port.interface";

/**
 * DI Token for PlatformModuleReadyPort.
 *
 * Platform-agnostic port for managing module ready state.
 * Used to set module.ready = true when bootstrap is complete.
 *
 * Default implementation: FoundryModuleReadyPort (for Foundry VTT)
 */
export const platformModuleReadyPortToken =
  createInjectionToken<PlatformModuleReadyPort>("PlatformModuleReadyPort");

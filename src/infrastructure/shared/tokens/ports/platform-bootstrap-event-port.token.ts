/**
 * DI Token for PlatformBootstrapEventPort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PlatformBootstrapEventPort } from "@/domain/ports/platform-bootstrap-event-port.interface";

/**
 * DI Token for PlatformBootstrapEventPort.
 *
 * Platform-agnostic bootstrap lifecycle events port.
 * Used for registering init/ready callbacks during module bootstrap.
 *
 * CRITICAL: This port uses direct platform APIs (e.g., Foundry Hooks.on())
 * because the full event system requires version detection which may not
 * be available before the init event runs.
 *
 * Default implementation: FoundryBootstrapEventAdapter (for Foundry VTT)
 */
export const platformBootstrapEventPortToken = createInjectionToken<PlatformBootstrapEventPort>(
  "PlatformBootstrapEventPort"
);

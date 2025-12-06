/**
 * Infrastructure-specific tokens for bootstrap and settings registration ports.
 *
 * Note: Most port tokens have been moved to @/application/tokens.
 * This file only contains infrastructure-layer specific tokens.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PlatformBootstrapEventPort } from "@/domain/ports/platform-bootstrap-event-port.interface";
import type { PlatformModuleReadyPort } from "@/domain/ports/platform-module-ready-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";

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

/**
 * DI Token for PlatformSettingsRegistrationPort.
 *
 * Domain-neutral settings port that doesn't expose Valibot schemas.
 * Uses validator functions instead of schemas for type safety.
 *
 * This port is preferred over PlatformSettingsPort when the caller
 * doesn't need Valibot schema validation (e.g., in application layer).
 *
 * Default implementation: FoundrySettingsRegistrationAdapter (for Foundry VTT)
 */
export const platformSettingsRegistrationPortToken =
  createInjectionToken<PlatformSettingsRegistrationPort>("PlatformSettingsRegistrationPort");

/**
 * Infrastructure-specific tokens for bootstrap and settings registration ports.
 *
 * Note: Most port tokens have been moved to @/application/tokens.
 * This file only contains infrastructure-layer specific tokens.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { BootstrapHooksPort } from "@/domain/ports/bootstrap-hooks-port.interface";
import type { SettingsRegistrationPort } from "@/domain/ports/settings-registration-port.interface";

/**
 * DI Token for BootstrapHooksPort.
 *
 * Platform-agnostic bootstrap lifecycle hooks port.
 * Used for registering init/ready callbacks during module bootstrap.
 *
 * CRITICAL: This port uses direct platform APIs (e.g., Foundry Hooks.on())
 * because the full event system requires version detection which may not
 * be available before the init hook runs.
 *
 * Default implementation: FoundryBootstrapHooksAdapter (for Foundry VTT)
 */
export const bootstrapHooksPortToken =
  createInjectionToken<BootstrapHooksPort>("BootstrapHooksPort");

/**
 * DI Token for SettingsRegistrationPort.
 *
 * Domain-neutral settings port that doesn't expose Valibot schemas.
 * Uses validator functions instead of schemas for type safety.
 *
 * This port is preferred over PlatformSettingsPort when the caller
 * doesn't need Valibot schema validation (e.g., in application layer).
 *
 * Default implementation: FoundrySettingsRegistrationAdapter (for Foundry VTT)
 */
export const settingsRegistrationPortToken = createInjectionToken<SettingsRegistrationPort>(
  "SettingsRegistrationPort"
);

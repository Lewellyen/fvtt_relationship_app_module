/**
 * Injection token for the BootstrapReadyHookService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";

/**
 * Injection token for the BootstrapReadyHookService.
 *
 * Service responsible for registering the Foundry 'ready' hook.
 * Uses direct Hooks.on() to avoid chicken-egg problem with version detection.
 *
 * @example
 * ```typescript
 * const readyHookService = container.resolve(bootstrapReadyHookServiceToken);
 * readyHookService.register();
 * ```
 */
export const bootstrapReadyHookServiceToken = createInjectionToken<BootstrapReadyHookService>(
  "BootstrapReadyHookService"
);

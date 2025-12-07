/**
 * Injection token for the BootstrapInitHookService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";

/**
 * Injection token for the BootstrapInitHookService.
 *
 * Service responsible for registering the Foundry 'init' hook.
 * Uses direct Hooks.on() to avoid chicken-egg problem with version detection.
 *
 * @example
 * ```typescript
 * const initHookService = container.resolve(bootstrapInitHookServiceToken);
 * initHookService.register();
 * ```
 */
export const bootstrapInitHookServiceToken = createInjectionToken<BootstrapInitHookService>(
  "BootstrapInitHookService"
);

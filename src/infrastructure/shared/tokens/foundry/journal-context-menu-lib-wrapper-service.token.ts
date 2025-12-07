/**
 * Injection token for JournalContextMenuLibWrapperService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { JournalContextMenuLibWrapperService } from "@/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService";

/**
 * Injection token for JournalContextMenuLibWrapperService.
 *
 * Service for managing libWrapper registration for journal context menu.
 * Handles the registration of the libWrapper wrapper function for the Foundry
 * ContextMenu.render method and manages callbacks that can modify context menu options.
 *
 * NOTE: This is NOT an event system. The libWrapper is registered once during init,
 * and callbacks are registered separately.
 *
 * @example
 * ```typescript
 * const service = container.resolve(journalContextMenuLibWrapperServiceToken);
 *
 * // Register libWrapper (called during init)
 * const result = service.register();
 *
 * // Add callback for handling context menu
 * service.addCallback((event) => {
 *   event.options.push({
 *     name: "Custom Option",
 *     icon: '<i class="fas fa-star"></i>',
 *     callback: () => { /* ... *\/ }
 *   });
 * });
 * ```
 */
export const journalContextMenuLibWrapperServiceToken =
  createInjectionToken<JournalContextMenuLibWrapperService>("JournalContextMenuLibWrapperService");

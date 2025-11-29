/**
 * @deprecated PlatformJournalEventPort and HideJournalContextMenuHandler tokens are now exported from @/application/tokens.
 * This file re-exports them for backward compatibility.
 */
// Re-export domain port tokens from Application layer
export {
  platformJournalEventPortToken,
  hideJournalContextMenuHandlerToken,
} from "@/application/tokens";

import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { InvalidateJournalCacheOnChangeUseCase } from "@/application/use-cases/invalidate-journal-cache-on-change.use-case";
import type { ProcessJournalDirectoryOnRenderUseCase } from "@/application/use-cases/process-journal-directory-on-render.use-case";
import type { TriggerJournalDirectoryReRenderUseCase } from "@/application/use-cases/trigger-journal-directory-rerender.use-case";
import type { RegisterContextMenuUseCase } from "@/application/use-cases/register-context-menu.use-case";
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";

/**
 * DI Token for InvalidateJournalCacheOnChangeUseCase.
 *
 * Use-case that invalidates journal cache when journal entries change.
 */
export const invalidateJournalCacheOnChangeUseCaseToken =
  createInjectionToken<InvalidateJournalCacheOnChangeUseCase>(
    "InvalidateJournalCacheOnChangeUseCase"
  );

/**
 * DI Token for ProcessJournalDirectoryOnRenderUseCase.
 *
 * Use-case that processes journal directory when it's rendered.
 */
export const processJournalDirectoryOnRenderUseCaseToken =
  createInjectionToken<ProcessJournalDirectoryOnRenderUseCase>(
    "ProcessJournalDirectoryOnRenderUseCase"
  );

/**
 * DI Token for TriggerJournalDirectoryReRenderUseCase.
 *
 * Use-case that triggers journal directory re-render when hidden flag changes.
 */
export const triggerJournalDirectoryReRenderUseCaseToken =
  createInjectionToken<TriggerJournalDirectoryReRenderUseCase>(
    "TriggerJournalDirectoryReRenderUseCase"
  );

/**
 * DI Token for RegisterContextMenuUseCase.
 *
 * Use-case that registers custom context menu entries for journal entries.
 */
export const registerContextMenuUseCaseToken = createInjectionToken<RegisterContextMenuUseCase>(
  "RegisterContextMenuUseCase"
);

/**
 * DI Token for ModuleEventRegistrar.
 *
 * Manages registration of all platform-agnostic event listeners.
 */
export const moduleEventRegistrarToken =
  createInjectionToken<ModuleEventRegistrar>("ModuleEventRegistrar");

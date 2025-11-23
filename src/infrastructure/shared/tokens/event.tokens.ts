import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { InvalidateJournalCacheOnChangeUseCase } from "@/application/use-cases/invalidate-journal-cache-on-change.use-case";
import type { ProcessJournalDirectoryOnRenderUseCase } from "@/application/use-cases/process-journal-directory-on-render.use-case";
import type { TriggerJournalDirectoryReRenderUseCase } from "@/application/use-cases/trigger-journal-directory-rerender.use-case";
import type { RegisterContextMenuUseCase } from "@/application/use-cases/register-context-menu.use-case";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";

/**
 * DI Token for PlatformJournalEventPort.
 *
 * Used to inject platform-agnostic journal event handling.
 * Default implementation: FoundryJournalEventAdapter (for Foundry VTT)
 */
export const platformJournalEventPortToken =
  createInjectionToken<PlatformJournalEventPort>("JournalEventPort");

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
 * DI Token for RegisterJournalContextMenuUseCase.
 *
 * @deprecated Use registerContextMenuUseCaseToken instead.
 * This token is kept for backwards compatibility but the implementation has been removed.
 */
export const registerJournalContextMenuUseCaseToken =
  createInjectionToken<RegisterContextMenuUseCase>("RegisterJournalContextMenuUseCase");

/**
 * DI Token for RegisterContextMenuUseCase.
 *
 * Use-case that registers custom context menu entries for journal entries.
 */
export const registerContextMenuUseCaseToken = createInjectionToken<RegisterContextMenuUseCase>(
  "RegisterContextMenuUseCase"
);

/**
 * DI Token for HideJournalContextMenuHandler.
 *
 * Handler that adds "Journal ausblenden" menu item to journal context menus.
 */
export const hideJournalContextMenuHandlerToken =
  createInjectionToken<HideJournalContextMenuHandler>("HideJournalContextMenuHandler");

/**
 * DI Token for ModuleEventRegistrar.
 *
 * Manages registration of all platform-agnostic event listeners.
 */
export const moduleEventRegistrarToken =
  createInjectionToken<ModuleEventRegistrar>("ModuleEventRegistrar");

import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { InvalidateJournalCacheOnChangeUseCase } from "@/application/use-cases/invalidate-journal-cache-on-change.use-case";
import type { ProcessJournalDirectoryOnRenderUseCase } from "@/application/use-cases/process-journal-directory-on-render.use-case";
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";

/**
 * DI Token for JournalEventPort.
 *
 * Used to inject platform-agnostic journal event handling.
 * Default implementation: FoundryJournalEventAdapter (for Foundry VTT)
 */
export const journalEventPortToken = createInjectionToken<JournalEventPort>("JournalEventPort");

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
 * DI Token for ModuleEventRegistrar.
 *
 * Manages registration of all platform-agnostic event listeners.
 */
export const moduleEventRegistrarToken =
  createInjectionToken<ModuleEventRegistrar>("ModuleEventRegistrar");

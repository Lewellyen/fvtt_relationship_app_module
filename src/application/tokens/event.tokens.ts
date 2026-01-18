/**
 * Application layer tokens for event-related use cases.
 *
 * These tokens define injection points for event use cases,
 * keeping the Application layer decoupled from Infrastructure-specific implementations.
 */
import { createUnsafeInjectionToken } from "@/application/di/unsafe-token-factory";

/**
 * DI Token for InvalidateJournalCacheOnChangeUseCase.
 *
 * Use-case that invalidates journal cache when journal entries change.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const invalidateJournalCacheOnChangeUseCaseToken = createUnsafeInjectionToken(
  "InvalidateJournalCacheOnChangeUseCase"
);

/**
 * DI Token for ProcessJournalDirectoryOnRenderUseCase.
 *
 * Use-case that processes journal directory when it's rendered.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const processJournalDirectoryOnRenderUseCaseToken = createUnsafeInjectionToken(
  "ProcessJournalDirectoryOnRenderUseCase"
);

/**
 * DI Token for TriggerJournalDirectoryReRenderUseCase.
 *
 * Use-case that triggers journal directory re-render when hidden flag changes.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const triggerJournalDirectoryReRenderUseCaseToken = createUnsafeInjectionToken(
  "TriggerJournalDirectoryReRenderUseCase"
);

/**
 * DI Token for RegisterContextMenuUseCase.
 *
 * Use-case that registers custom context menu entries for journal entries.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const registerContextMenuUseCaseToken = createUnsafeInjectionToken(
  "RegisterContextMenuUseCase"
);

/**
 * DI Token for ShowAllHiddenJournalsUseCase.
 *
 * Use-case that shows all hidden journals by setting their hidden flag to false.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const showAllHiddenJournalsUseCaseToken = createUnsafeInjectionToken(
  "ShowAllHiddenJournalsUseCase"
);

/**
 * DI Token for SidebarButtonBootstrapper.
 *
 * Bootstrapper that registers sidebar button for showing all hidden journals.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const sidebarButtonBootstrapperToken = createUnsafeInjectionToken(
  "SidebarButtonBootstrapper"
);

/**
 * DI Token for ModuleEventRegistrar.
 *
 * Manages registration of all platform-agnostic event listeners.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const moduleEventRegistrarToken = createUnsafeInjectionToken("ModuleEventRegistrar");

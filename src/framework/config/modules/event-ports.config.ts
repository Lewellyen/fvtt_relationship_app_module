import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/infrastructure/shared/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  journalEventPortToken,
  invalidateJournalCacheOnChangeUseCaseToken,
  processJournalDirectoryOnRenderUseCaseToken,
  moduleEventRegistrarToken,
} from "@/infrastructure/shared/tokens";
import { DIFoundryJournalEventAdapter } from "@/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter";
import { DIInvalidateJournalCacheOnChangeUseCase } from "@/application/use-cases/invalidate-journal-cache-on-change.use-case";
import { DIProcessJournalDirectoryOnRenderUseCase } from "@/application/use-cases/process-journal-directory-on-render.use-case";
import { DIModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";

/**
 * Registers event port services.
 *
 * Services registered:
 * - JournalEventPort (singleton) - Platform-agnostic journal event handling
 * - InvalidateJournalCacheOnChangeUseCase (singleton) - Cache invalidation use-case
 * - ProcessJournalDirectoryOnRenderUseCase (singleton) - Directory render use-case
 * - ModuleEventRegistrar (singleton) - Manages all event listeners
 *
 * DESIGN: Event ports are platform-agnostic abstractions over event systems.
 * They enable multi-VTT support by decoupling from Foundry-specific APIs.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerEventPorts(container: ServiceContainer): Result<void, string> {
  // Register JournalEventPort (Foundry implementation)
  const eventPortResult = container.registerClass(
    journalEventPortToken,
    DIFoundryJournalEventAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(eventPortResult)) {
    return err(`Failed to register JournalEventPort: ${eventPortResult.error.message}`);
  }

  // Register InvalidateJournalCacheOnChangeUseCase
  const cacheInvalidationUseCaseResult = container.registerClass(
    invalidateJournalCacheOnChangeUseCaseToken,
    DIInvalidateJournalCacheOnChangeUseCase,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(cacheInvalidationUseCaseResult)) {
    return err(
      `Failed to register InvalidateJournalCacheOnChangeUseCase: ${cacheInvalidationUseCaseResult.error.message}`
    );
  }

  // Register ProcessJournalDirectoryOnRenderUseCase
  const directoryRenderUseCaseResult = container.registerClass(
    processJournalDirectoryOnRenderUseCaseToken,
    DIProcessJournalDirectoryOnRenderUseCase,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(directoryRenderUseCaseResult)) {
    return err(
      `Failed to register ProcessJournalDirectoryOnRenderUseCase: ${directoryRenderUseCaseResult.error.message}`
    );
  }

  // Register ModuleEventRegistrar
  const eventRegistrarResult = container.registerClass(
    moduleEventRegistrarToken,
    DIModuleEventRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(eventRegistrarResult)) {
    return err(`Failed to register ModuleEventRegistrar: ${eventRegistrarResult.error.message}`);
  }

  return ok(undefined);
}

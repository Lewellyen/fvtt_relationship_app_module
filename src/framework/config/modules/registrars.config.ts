import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/infrastructure/shared/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  moduleSettingsRegistrarToken,
  moduleHookRegistrarToken,
  renderJournalDirectoryHookToken,
  journalCacheInvalidationHookToken,
} from "@/infrastructure/shared/tokens";
import { DIModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";
import { DIModuleHookRegistrar } from "@/application/services/ModuleHookRegistrar";
import { DIRenderJournalDirectoryHook } from "@/application/use-cases/render-journal-directory-hook";
import { DIJournalCacheInvalidationHook } from "@/application/use-cases/journal-cache-invalidation-hook";

/**
 * Registers registrar services.
 *
 * Services registered:
 * - RenderJournalDirectoryHook (singleton) - Individual hook
 * - JournalCacheInvalidationHook (singleton) - Cache invalidation hook
 * - ModuleHookRegistrar (singleton) - Manages all hooks
 * - ModuleSettingsRegistrar (singleton) - Manages all settings
 *
 * DESIGN: Registrars are DI services that can be resolved when needed.
 * They are NOT instantiated with 'new' in business logic.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerRegistrars(container: ServiceContainer): Result<void, string> {
  // Register RenderJournalDirectoryHook
  const renderJournalHookResult = container.registerClass(
    renderJournalDirectoryHookToken,
    DIRenderJournalDirectoryHook,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(renderJournalHookResult)) {
    return err(
      `Failed to register RenderJournalDirectoryHook: ${renderJournalHookResult.error.message}`
    );
  }

  const cacheInvalidationHookResult = container.registerClass(
    journalCacheInvalidationHookToken,
    DIJournalCacheInvalidationHook,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(cacheInvalidationHookResult)) {
    return err(
      `Failed to register JournalCacheInvalidationHook: ${cacheInvalidationHookResult.error.message}`
    );
  }

  // Register ModuleHookRegistrar (depends on hooks)
  const hookRegistrarResult = container.registerClass(
    moduleHookRegistrarToken,
    DIModuleHookRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(hookRegistrarResult)) {
    return err(`Failed to register ModuleHookRegistrar: ${hookRegistrarResult.error.message}`);
  }

  // Register ModuleSettingsRegistrar
  const settingsRegistrarResult = container.registerClass(
    moduleSettingsRegistrarToken,
    DIModuleSettingsRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsRegistrarResult)) {
    return err(
      `Failed to register ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
    );
  }

  return ok(undefined);
}

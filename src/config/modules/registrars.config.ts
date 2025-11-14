import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import {
  moduleSettingsRegistrarToken,
  moduleHookRegistrarToken,
  renderJournalDirectoryHookToken,
} from "@/tokens/tokenindex";
import { DIModuleSettingsRegistrar } from "@/core/module-settings-registrar";
import { DIModuleHookRegistrar } from "@/core/module-hook-registrar";
import { DIRenderJournalDirectoryHook } from "@/core/hooks/render-journal-directory-hook";

/**
 * Registers registrar services.
 *
 * Services registered:
 * - RenderJournalDirectoryHook (singleton) - Individual hook
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

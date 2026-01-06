import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { dependencyRegistry } from "@/framework/config/dependency-registry";
import { windowRegistryToken } from "@/application/windows/tokens/window.tokens";
import { createJournalOverviewWindowDefinition } from "@/application/windows/definitions/journal-overview-window.definition";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import JournalOverviewWindow from "@/framework/ui/svelte/JournalOverviewWindow.svelte";

/**
 * Registers Journal Overview Window Definition.
 *
 * This function registers the window definition in the WindowRegistry
 * during bootstrap, making it available for window creation.
 *
 * Priority: 180 (after validation (170), same as Loop Prevention Init)
 * Note: Must run after validation because it needs to resolve WindowRegistry from container.
 */
export function registerJournalOverviewWindow(container: ServiceContainer): Result<void, string> {
  // Get WindowRegistry (container must be validated at this point)
  const registryResult = container.resolveWithError(windowRegistryToken);
  if (!registryResult.ok) {
    return err(`Failed to resolve WindowRegistry: ${registryResult.error.message}`);
  }

  const registry = castResolvedService<
    import("@/domain/windows/ports/window-registry-port.interface").IWindowRegistry
  >(registryResult.value);

  // Create window definition with Svelte component (provided by framework layer)
  const definition = createJournalOverviewWindowDefinition(JournalOverviewWindow);

  // Register definition
  const registerResult = registry.registerDefinition(definition);
  if (isErr(registerResult)) {
    return err(
      `Failed to register Journal Overview Window Definition: ${registerResult.error.message}`
    );
  }

  return ok(undefined);
}

/**
 * Self-register this module's dependency configuration step.
 * This is called automatically when the module is imported.
 */
dependencyRegistry.register({
  name: "JournalOverviewWindow",
  priority: 180, // After validation (170), same as Loop Prevention Init
  execute: registerJournalOverviewWindow,
});

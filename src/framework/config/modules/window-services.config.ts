import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { dependencyRegistry } from "@/framework/config/dependency-registry";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";

// Window Framework Tokens
import {
  windowFactoryToken,
  windowRegistryToken,
  eventBusToken,
  stateStoreToken,
  actionDispatcherToken,
  rendererRegistryToken,
  bindingEngineToken,
  viewModelBuilderToken,
  remoteSyncGateToken,
  persistAdapterToken,
  foundryWindowAdapterToken,
  statePortFactoryToken,
  sharedDocumentCacheToken,
} from "@/application/windows/tokens/window.tokens";

// Window Framework Services
import { WindowRegistry } from "@/application/windows/services/window-registry";
import { EventBus } from "@/application/windows/services/event-bus";
import { StateStore } from "@/application/windows/services/state-store";
import { ActionDispatcher } from "@/application/windows/services/action-dispatcher";
import { RendererRegistry } from "@/application/windows/services/renderer-registry";
import { BindingEngine } from "@/application/windows/services/binding-engine";
import { RemoteSyncGate } from "@/application/windows/services/remote-sync-gate";
import { ViewModelBuilder as ViewModelBuilderImpl } from "@/application/windows/services/view-model-builder";
import { FoundryWindowAdapter } from "@/infrastructure/windows/adapters/foundry/window/foundry-window-adapter";
import { RuneStateFactory } from "@/infrastructure/windows/state/rune-state-factory";
import { GlobalDocumentCache } from "@/infrastructure/windows/state/global-document-cache";
import { SvelteRenderer } from "@/infrastructure/windows/renderers/svelte-renderer";
import { CompositePersistAdapter } from "@/infrastructure/windows/adapters/persist/composite-persist-adapter";
import { WindowFactory } from "@/application/windows/services/window-factory";
import { WindowHooksService } from "@/application/windows/services/window-hooks-service";
import { WindowPositionManager } from "@/application/windows/services/window-position-manager";
import {
  windowHooksServiceToken,
  windowPositionManagerToken,
} from "@/application/windows/tokens/window.tokens";
import { platformContainerPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * Registers Window Framework services.
 *
 * Services registered:
 * - EventBus (singleton)
 * - StateStore (singleton)
 * - WindowRegistry (singleton)
 * - RemoteSyncGate (singleton)
 * - RendererRegistry (singleton) - with SvelteRenderer registered
 * - StatePortFactory (singleton) - RuneStateFactory
 * - SharedDocumentCache (singleton) - GlobalDocumentCache
 * - PersistAdapter (singleton) - FlagsPersistAdapter (can be extended with other adapters)
 * - FoundryWindowAdapter (singleton)
 * - ActionDispatcher (singleton) - depends on WindowRegistry
 * - BindingEngine (singleton) - depends on StateStore, PersistAdapter
 * - ViewModelBuilder (singleton)
 * - WindowFactory (singleton) - depends on WindowRegistry, FoundryWindowAdapter, and controller factory
 *
 * Priority: 150 (after core services, before validation)
 */
export function registerWindowServices(container: ServiceContainer): Result<void, string> {
  // 1. Register singleton services without dependencies
  const eventBusResult = container.registerClass(
    eventBusToken,
    EventBus,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(eventBusResult)) {
    return err(`Failed to register EventBus: ${eventBusResult.error.message}`);
  }

  const stateStoreResult = container.registerClass(
    stateStoreToken,
    StateStore,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(stateStoreResult)) {
    return err(`Failed to register StateStore: ${stateStoreResult.error.message}`);
  }

  const windowRegistryResult = container.registerClass(
    windowRegistryToken,
    WindowRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(windowRegistryResult)) {
    return err(`Failed to register WindowRegistry: ${windowRegistryResult.error.message}`);
  }

  const remoteSyncGateResult = container.registerClass(
    remoteSyncGateToken,
    RemoteSyncGate,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(remoteSyncGateResult)) {
    return err(`Failed to register RemoteSyncGate: ${remoteSyncGateResult.error.message}`);
  }

  const rendererRegistryResult = container.registerClass(
    rendererRegistryToken,
    RendererRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(rendererRegistryResult)) {
    return err(`Failed to register RendererRegistry: ${rendererRegistryResult.error.message}`);
  }

  // 2. Register StatePortFactory and SharedDocumentCache
  const statePortFactoryResult = container.registerClass(
    statePortFactoryToken,
    RuneStateFactory,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(statePortFactoryResult)) {
    return err(`Failed to register StatePortFactory: ${statePortFactoryResult.error.message}`);
  }

  // Register GlobalDocumentCache as singleton value (it's a singleton instance)
  const sharedCache = GlobalDocumentCache.getInstance();
  const sharedCacheResult = container.registerValue(sharedDocumentCacheToken, sharedCache);
  if (isErr(sharedCacheResult)) {
    return err(`Failed to register SharedDocumentCache: ${sharedCacheResult.error.message}`);
  }

  // 3. Register PersistAdapter (CompositePersistAdapter for Phase 2: supports Flags + Settings)
  const persistAdapterResult = container.registerClass(
    persistAdapterToken,
    CompositePersistAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(persistAdapterResult)) {
    return err(`Failed to register PersistAdapter: ${persistAdapterResult.error.message}`);
  }

  // 4. Register FoundryWindowAdapter
  const foundryAdapterResult = container.registerClass(
    foundryWindowAdapterToken,
    FoundryWindowAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryAdapterResult)) {
    return err(`Failed to register FoundryWindowAdapter: ${foundryAdapterResult.error.message}`);
  }

  // 5. Register services with dependencies (dependencies defined via static property)
  const actionDispatcherResult = container.registerClass(
    actionDispatcherToken,
    ActionDispatcher,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(actionDispatcherResult)) {
    return err(`Failed to register ActionDispatcher: ${actionDispatcherResult.error.message}`);
  }

  const bindingEngineResult = container.registerClass(
    bindingEngineToken,
    BindingEngine,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(bindingEngineResult)) {
    return err(`Failed to register BindingEngine: ${bindingEngineResult.error.message}`);
  }

  const viewModelBuilderResult = container.registerClass(
    viewModelBuilderToken,
    ViewModelBuilderImpl,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(viewModelBuilderResult)) {
    return err(`Failed to register ViewModelBuilder: ${viewModelBuilderResult.error.message}`);
  }

  // 6. Register WindowFactory (needs Container for resolving dependencies)
  const windowFactoryFactoryResult = container.registerFactory(
    windowFactoryToken,
    () => {
      const registry = container.resolve(
        windowRegistryToken
      ) as import("@/domain/windows/ports/window-registry-port.interface").IWindowRegistry;
      const foundryAdapter = container.resolve(
        foundryWindowAdapterToken
      ) as import("@/domain/windows/ports/foundry-window-adapter.interface").IFoundryWindowAdapter;
      // Pass container as PlatformContainerPort for resolving WindowController dependencies
      const containerPort = container.resolve(
        platformContainerPortToken
      ) as import("@/domain/ports/platform-container-port.interface").PlatformContainerPort;
      return new WindowFactory(registry, foundryAdapter, containerPort);
    },
    ServiceLifecycle.SINGLETON,
    [windowRegistryToken, foundryWindowAdapterToken, platformContainerPortToken]
  );
  if (isErr(windowFactoryFactoryResult)) {
    return err(`Failed to register WindowFactory: ${windowFactoryFactoryResult.error.message}`);
  }

  // 7. Register WindowPositionManager (Phase 2)
  const windowPositionManagerResult = container.registerClass(
    windowPositionManagerToken,
    WindowPositionManager,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(windowPositionManagerResult)) {
    return err(
      `Failed to register WindowPositionManager: ${windowPositionManagerResult.error.message}`
    );
  }

  // 8. Register WindowHooksService
  const windowHooksServiceResult = container.registerClass(
    windowHooksServiceToken,
    WindowHooksService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(windowHooksServiceResult)) {
    return err(`Failed to register WindowHooksService: ${windowHooksServiceResult.error.message}`);
  }

  // 9. Register SvelteRenderer in RendererRegistry (after RendererRegistry is registered)
  // This needs to happen after the registry is created, so we do it in an init phase
  const rendererRegistryResolvedResult = container.resolveWithError(rendererRegistryToken);
  if (rendererRegistryResolvedResult.ok) {
    const rendererRegistryResolved = castResolvedService<
      import("@/domain/windows/ports/renderer-registry-port.interface").IRendererRegistry
    >(rendererRegistryResolvedResult.value);
    const svelteRenderer = new SvelteRenderer();
    rendererRegistryResolved.register("svelte", svelteRenderer);
  }

  return ok(undefined);
}

/**
 * Self-register this module's dependency configuration step.
 * This is called automatically when the module is imported.
 */
dependencyRegistry.register({
  name: "WindowServices",
  priority: 150, // After core services (140), before validation (170)
  execute: registerWindowServices,
});

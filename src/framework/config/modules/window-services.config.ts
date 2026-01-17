import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { dependencyRegistry } from "@/framework/config/dependency-registry";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { IFoundryWindowAdapter } from "@/domain/windows/ports/foundry-window-adapter.interface";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";

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
import { GlobalDocumentCache } from "@/infrastructure/windows/state/global-document-cache.svelte";
import { SvelteRenderer } from "@/infrastructure/windows/renderers/svelte-renderer";
import { CompositePersistAdapter } from "@/infrastructure/windows/adapters/persist/composite-persist-adapter";
import { WindowFactory } from "@/application/windows/services/window-factory";
import { WindowHooksService } from "@/application/windows/services/window-hooks-service";
import { WindowPositionManager } from "@/application/windows/services/window-position-manager";
import { WindowHooksBridge } from "@/infrastructure/windows/adapters/foundry/hooks/window-hooks";
import { WindowStateInitializer } from "@/application/windows/services/window-state-initializer";
import { WindowRendererCoordinator } from "@/application/windows/services/window-renderer-coordinator";
import { WindowPersistenceCoordinator } from "@/application/windows/services/window-persistence-coordinator";
import { WindowDefaultStateProviderRegistry } from "@/application/windows/services/window-default-state-provider-registry";
import { JournalOverviewStateInitializer } from "@/application/windows/services/journal-overview-state-initializer";
import {
  windowHooksServiceToken,
  windowHooksBridgeToken,
  windowPositionManagerToken,
  windowDefaultStateProviderRegistryToken,
  windowStateInitializerToken,
  windowRendererCoordinatorToken,
  windowPersistenceCoordinatorToken,
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

  // Create RendererRegistry instance directly so we can register SvelteRenderer immediately
  const rendererRegistry = new RendererRegistry();
  const rendererRegistryResult = container.registerValue(rendererRegistryToken, rendererRegistry);
  if (isErr(rendererRegistryResult)) {
    return err(`Failed to register RendererRegistry: ${rendererRegistryResult.error.message}`);
  }

  // Register SvelteRenderer immediately (we have the instance, no need to resolve)
  const svelteRenderer = new SvelteRenderer();
  rendererRegistry.register("svelte", svelteRenderer);

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

  // 5a. Register WindowDefaultStateProviderRegistry and populate with providers
  const providerRegistry = new WindowDefaultStateProviderRegistry();
  // Register journal-overview provider
  providerRegistry.register("journal-overview", new JournalOverviewStateInitializer());
  const providerRegistryResult = container.registerValue(
    windowDefaultStateProviderRegistryToken,
    providerRegistry
  );
  if (isErr(providerRegistryResult)) {
    return err(
      `Failed to register WindowDefaultStateProviderRegistry: ${providerRegistryResult.error.message}`
    );
  }

  // 5b. Register WindowStateInitializer (depends on WindowDefaultStateProviderRegistry)
  const stateInitializerResult = container.registerClass(
    windowStateInitializerToken,
    WindowStateInitializer,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(stateInitializerResult)) {
    return err(
      `Failed to register WindowStateInitializer: ${stateInitializerResult.error.message}`
    );
  }

  // 5c. Register WindowRendererCoordinator (depends on RendererRegistry)
  const rendererCoordinatorResult = container.registerClass(
    windowRendererCoordinatorToken,
    WindowRendererCoordinator,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(rendererCoordinatorResult)) {
    return err(
      `Failed to register WindowRendererCoordinator: ${rendererCoordinatorResult.error.message}`
    );
  }

  // 5d. Register WindowPersistenceCoordinator (depends on PersistAdapter)
  const persistenceCoordinatorResult = container.registerClass(
    windowPersistenceCoordinatorToken,
    WindowPersistenceCoordinator,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(persistenceCoordinatorResult)) {
    return err(
      `Failed to register WindowPersistenceCoordinator: ${persistenceCoordinatorResult.error.message}`
    );
  }

  // 6. Register WindowFactory (needs Container for resolving dependencies)
  const windowFactoryFactoryResult = container.registerFactory(
    windowFactoryToken,
    () => {
      // Use resolveWithError() instead of resolve() to avoid API boundary violations
      const registryResult = container.resolveWithError<IWindowRegistry>(windowRegistryToken);
      if (!registryResult.ok) {
        throw new Error(`Failed to resolve WindowRegistry: ${registryResult.error.message}`);
      }
      const registry = registryResult.value;

      const foundryAdapterResult =
        container.resolveWithError<IFoundryWindowAdapter>(foundryWindowAdapterToken);
      if (!foundryAdapterResult.ok) {
        throw new Error(
          `Failed to resolve FoundryWindowAdapter: ${foundryAdapterResult.error.message}`
        );
      }
      const foundryAdapter = foundryAdapterResult.value;

      // Pass container as PlatformContainerPort for resolving WindowController dependencies
      const containerPortResult = container.resolveWithError<PlatformContainerPort>(
        platformContainerPortToken
      );
      if (!containerPortResult.ok) {
        throw new Error(
          `Failed to resolve PlatformContainerPort: ${containerPortResult.error.message}`
        );
      }
      const containerPort = containerPortResult.value;

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

  // 8. Register WindowHooksBridge (must be registered before WindowHooksService)
  const windowHooksBridgeResult = container.registerClass(
    windowHooksBridgeToken,
    WindowHooksBridge,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(windowHooksBridgeResult)) {
    return err(`Failed to register WindowHooksBridge: ${windowHooksBridgeResult.error.message}`);
  }

  // 9. Register WindowHooksService (depends on WindowHooksBridge)
  const windowHooksServiceResult = container.registerClass(
    windowHooksServiceToken,
    WindowHooksService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(windowHooksServiceResult)) {
    return err(`Failed to register WindowHooksService: ${windowHooksServiceResult.error.message}`);
  }

  // Note: SvelteRenderer is already registered above (step 1) when we created the RendererRegistry instance

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

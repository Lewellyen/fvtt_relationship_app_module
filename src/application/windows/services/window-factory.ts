import type { IWindowFactory } from "@/domain/windows/ports/window-factory-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { WindowHandle } from "@/domain/windows/types/window-handle.interface";
import type { WindowInstance } from "@/domain/windows/types/window-handle.interface";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IFoundryWindowAdapter } from "@/domain/windows/ports/foundry-window-adapter.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { WindowController } from "./window-controller";
import { ok, err } from "@/domain/utils/result";
import {
  windowRegistryToken,
  stateStoreToken,
  statePortFactoryToken,
  actionDispatcherToken,
  bindingEngineToken,
  viewModelBuilderToken,
  eventBusToken,
  remoteSyncGateToken,
  windowStateInitializerToken,
  windowRendererCoordinatorToken,
  windowPersistenceCoordinatorToken,
} from "../tokens/window.tokens";
import { castResolvedService } from "@/application/windows/utils/service-casts";

/**
 * WindowFactory - Erstellt WindowController + Foundry-App aus WindowDefinition
 */
export class WindowFactory implements IWindowFactory {
  constructor(
    private readonly registry: IWindowRegistry,
    private readonly foundryWindowAdapter: IFoundryWindowAdapter,
    private readonly container: PlatformContainerPort
  ) {}

  async createWindow(
    definitionId: string,
    instanceKey?: string,
    overrides?: Partial<WindowDefinition>
  ): Promise<import("@/domain/types/result").Result<WindowHandle, WindowError>> {
    // 1. Definition holen
    const definitionResult = this.registry.getDefinition(definitionId);
    if (!definitionResult.ok) {
      return err(definitionResult.error);
    }

    let definition = definitionResult.value;

    // 2. Overrides anwenden
    if (overrides) {
      definition = { ...definition, ...overrides };
    }

    // 3. Instance-ID generieren
    const instanceId = instanceKey
      ? `${definitionId}:${instanceKey}`
      : `${definitionId}:${Date.now()}-${Math.random()}`;

    // 4. WindowController erstellen
    const controller = this.createController(instanceId, definitionId, definition);

    // 5. Foundry ApplicationWrapper erstellen
    const appClassResult = this.foundryWindowAdapter.buildApplicationWrapper(
      definition,
      controller,
      instanceId
    );
    if (!appClassResult.ok) {
      return err(appClassResult.error);
    }

    const appClass = appClassResult.value;
    const app = new appClass();

    // 6. WindowInstance erstellen
    const instance: WindowInstance = {
      instanceId,
      definitionId,
      foundryApp: app,
      controller, // Für Hook-Bridge Zugriff
    };

    // 7. Instance registrieren
    const registerResult = this.registry.registerInstance(instance);
    if (!registerResult.ok) return err(registerResult.error);

    // 8. WindowHandle erstellen
    const registry = this.registry; // Capture for closure
    const handle: WindowHandle = {
      instanceId,
      definitionId,
      controller,
      definition: definition as Readonly<WindowDefinition>,
      async show() {
        await app.render({ force: true });
        return ok(undefined);
      },
      async hide() {
        // Neue Foundry API: render({ force: false }) statt render(false)
        await app.render({ force: false });
        return ok(undefined);
      },
      async close() {
        await app.close();
        const unregisterResult = registry.unregisterInstance(instanceId);
        return unregisterResult;
      },
      async update(state) {
        return controller.updateStateLocal(state);
      },
      async persist() {
        return controller.persist();
      },
      async restore() {
        return controller.restore();
      },
    };

    return ok(handle);
  }

  private createController(
    instanceId: string,
    definitionId: string,
    definition: WindowDefinition
  ): WindowController {
    // Use resolveWithError() instead of resolve() to avoid API boundary violations
    const registryResult = this.container.resolveWithError(windowRegistryToken);
    if (!registryResult.ok) {
      throw new Error(`Failed to resolve WindowRegistry: ${registryResult.error.message}`);
    }
    const registry = castResolvedService<IWindowRegistry>(registryResult.value);

    const stateStoreResult = this.container.resolveWithError(stateStoreToken);
    if (!stateStoreResult.ok) {
      throw new Error(`Failed to resolve StateStore: ${stateStoreResult.error.message}`);
    }
    const stateStore = castResolvedService<
      import("@/domain/windows/ports/state-store-port.interface").IStateStore
    >(stateStoreResult.value);

    const statePortFactoryResult = this.container.resolveWithError(statePortFactoryToken);
    if (!statePortFactoryResult.ok) {
      throw new Error(
        `Failed to resolve StatePortFactory: ${statePortFactoryResult.error.message}`
      );
    }
    const statePortFactory = castResolvedService<
      import("@/application/windows/ports/state-port-factory-port.interface").IStatePortFactory
    >(statePortFactoryResult.value);

    const actionDispatcherResult = this.container.resolveWithError(actionDispatcherToken);
    if (!actionDispatcherResult.ok) {
      throw new Error(
        `Failed to resolve ActionDispatcher: ${actionDispatcherResult.error.message}`
      );
    }
    const actionDispatcher = castResolvedService<
      import("@/domain/windows/ports/action-dispatcher-port.interface").IActionDispatcher
    >(actionDispatcherResult.value);

    const bindingEngineResult = this.container.resolveWithError(bindingEngineToken);
    if (!bindingEngineResult.ok) {
      throw new Error(`Failed to resolve BindingEngine: ${bindingEngineResult.error.message}`);
    }
    const bindingEngine = castResolvedService<
      import("@/domain/windows/ports/binding-engine-port.interface").IBindingEngine
    >(bindingEngineResult.value);

    const viewModelBuilderResult = this.container.resolveWithError(viewModelBuilderToken);
    if (!viewModelBuilderResult.ok) {
      throw new Error(
        `Failed to resolve ViewModelBuilder: ${viewModelBuilderResult.error.message}`
      );
    }
    const viewModelBuilder = castResolvedService<
      import("@/domain/windows/ports/view-model-builder-port.interface").IViewModelBuilder
    >(viewModelBuilderResult.value);

    const eventBusResult = this.container.resolveWithError(eventBusToken);
    if (!eventBusResult.ok) {
      throw new Error(`Failed to resolve EventBus: ${eventBusResult.error.message}`);
    }
    const eventBus = castResolvedService<
      import("@/domain/windows/ports/event-bus-port.interface").IEventBus
    >(eventBusResult.value);

    const remoteSyncGateResult = this.container.resolveWithError(remoteSyncGateToken);
    if (!remoteSyncGateResult.ok) {
      throw new Error(`Failed to resolve RemoteSyncGate: ${remoteSyncGateResult.error.message}`);
    }
    const remoteSyncGate = castResolvedService<
      import("@/domain/windows/ports/remote-sync-gate-port.interface").IRemoteSyncGate
    >(remoteSyncGateResult.value);

    const stateInitializerResult = this.container.resolveWithError(windowStateInitializerToken);
    if (!stateInitializerResult.ok) {
      throw new Error(
        `Failed to resolve WindowStateInitializer: ${stateInitializerResult.error.message}`
      );
    }
    const stateInitializer = castResolvedService<
      import("../ports/window-state-initializer-port.interface").IWindowStateInitializer
    >(stateInitializerResult.value);

    const rendererCoordinatorResult = this.container.resolveWithError(
      windowRendererCoordinatorToken
    );
    if (!rendererCoordinatorResult.ok) {
      throw new Error(
        `Failed to resolve WindowRendererCoordinator: ${rendererCoordinatorResult.error.message}`
      );
    }
    const rendererCoordinator = castResolvedService<
      import("../ports/window-renderer-coordinator-port.interface").IWindowRendererCoordinator
    >(rendererCoordinatorResult.value);

    const persistenceCoordinatorResult = this.container.resolveWithError(
      windowPersistenceCoordinatorToken
    );
    if (!persistenceCoordinatorResult.ok) {
      throw new Error(
        `Failed to resolve WindowPersistenceCoordinator: ${persistenceCoordinatorResult.error.message}`
      );
    }
    const persistenceCoordinator = castResolvedService<
      import("../ports/window-persistence-coordinator-port.interface").IWindowPersistenceCoordinator
    >(persistenceCoordinatorResult.value);

    return new WindowController(
      instanceId,
      definitionId,
      definition,
      registry,
      stateStore,
      statePortFactory,
      actionDispatcher,
      bindingEngine,
      viewModelBuilder,
      eventBus,
      remoteSyncGate,
      stateInitializer,
      rendererCoordinator,
      persistenceCoordinator,
      this.container // Pass container for action handlers
    );
  }
}

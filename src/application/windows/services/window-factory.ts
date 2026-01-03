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
  rendererRegistryToken,
  bindingEngineToken,
  viewModelBuilderToken,
  eventBusToken,
  remoteSyncGateToken,
  persistAdapterToken,
} from "../tokens/window.tokens";

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
    if (!definitionResult.ok) return err(definitionResult.error);

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
    if (!appClassResult.ok) return err(appClassResult.error);

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
        await app.render();
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
    const registry = this.container.resolve(windowRegistryToken) as IWindowRegistry;
    const stateStore = this.container.resolve(
      stateStoreToken
    ) as import("@/domain/windows/ports/state-store-port.interface").IStateStore;
    const statePortFactory = this.container.resolve(
      statePortFactoryToken
    ) as import("@/application/windows/ports/state-port-factory-port.interface").IStatePortFactory;
    const actionDispatcher = this.container.resolve(
      actionDispatcherToken
    ) as import("@/domain/windows/ports/action-dispatcher-port.interface").IActionDispatcher;
    const rendererRegistry = this.container.resolve(
      rendererRegistryToken
    ) as import("@/domain/windows/ports/renderer-registry-port.interface").IRendererRegistry;
    const bindingEngine = this.container.resolve(
      bindingEngineToken
    ) as import("@/domain/windows/ports/binding-engine-port.interface").IBindingEngine;
    const viewModelBuilder = this.container.resolve(
      viewModelBuilderToken
    ) as import("@/domain/windows/ports/view-model-builder-port.interface").IViewModelBuilder;
    const eventBus = this.container.resolve(
      eventBusToken
    ) as import("@/domain/windows/ports/event-bus-port.interface").IEventBus;
    const remoteSyncGate = this.container.resolve(
      remoteSyncGateToken
    ) as import("@/domain/windows/ports/remote-sync-gate-port.interface").IRemoteSyncGate;
    const persistAdapter = this.container.resolve(persistAdapterToken) as
      | import("@/domain/windows/ports/persist-adapter-port.interface").IPersistAdapter
      | undefined;

    return new WindowController(
      instanceId,
      definitionId,
      definition,
      registry,
      stateStore,
      statePortFactory,
      actionDispatcher,
      rendererRegistry,
      bindingEngine,
      viewModelBuilder,
      eventBus,
      remoteSyncGate,
      persistAdapter
    );
  }
}

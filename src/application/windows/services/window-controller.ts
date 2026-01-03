import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import type { ViewModel, IWindowState } from "@/domain/windows/types/view-model.interface";
import type { ComponentInstance } from "@/domain/windows/types/component-instance.interface";
import type { ActionContext } from "@/domain/windows/types/action-definition.interface";
import type { PersistMeta } from "@/domain/windows/types/persist-config.interface";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IStateStore } from "@/domain/windows/ports/state-store-port.interface";
import type { IActionDispatcher } from "@/domain/windows/ports/action-dispatcher-port.interface";
import type { IRendererRegistry } from "@/domain/windows/ports/renderer-registry-port.interface";
import type { IBindingEngine } from "@/domain/windows/ports/binding-engine-port.interface";
import type { IViewModelBuilder } from "@/domain/windows/ports/view-model-builder-port.interface";
import type { IEventBus } from "@/domain/windows/ports/event-bus-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { IStatePortFactory } from "../ports/state-port-factory-port.interface";
import { ok, err } from "@/domain/utils/result";

/**
 * WindowController - Kernstück des Window-Frameworks
 *
 * Orchestriert Lifecycle, Bindings, Props, Actions.
 * Wird von FoundryApplicationWrapper bei render() und close() aufgerufen.
 */
export class WindowController implements IWindowController {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly definition: Readonly<WindowDefinition>;

  private componentInstance: ComponentInstance | null = null;
  private element?: HTMLElement;
  private cachedViewModel?: ViewModel;
  private statePort: IWindowState<Record<string, unknown>>;
  private isMounted = false;

  constructor(
    instanceId: string,
    definitionId: string,
    definition: WindowDefinition,
    private readonly registry: IWindowRegistry,
    private readonly stateStore: IStateStore,
    private readonly statePortFactory: IStatePortFactory,
    private readonly actionDispatcher: IActionDispatcher,
    private readonly rendererRegistry: IRendererRegistry,
    private readonly bindingEngine: IBindingEngine,
    private readonly viewModelBuilder: IViewModelBuilder,
    private readonly eventBus: IEventBus,
    private readonly remoteSyncGate: IRemoteSyncGate,
    private readonly persistAdapter?: IPersistAdapter
  ) {
    this.instanceId = instanceId;
    this.definitionId = definitionId;
    this.definition = definition;

    // StatePort erstellen (reaktive State-API)
    this.statePort = this.createStatePort();
  }

  get state(): Readonly<Record<string, unknown>> {
    const result = this.stateStore.getAll(this.instanceId);
    return result.ok ? result.value : {};
  }

  async onFoundryRender(
    element: HTMLElement
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    if (this.isMounted) {
      // Bereits gemountet - sollte nicht passieren, aber sicherheitshalber
      return ok(undefined);
    }

    this.element = element;

    // 1. Bindings initialisieren
    const bindResult = this.bindingEngine.initialize(this.definition, this.instanceId);
    if (!bindResult.ok) return err(bindResult.error);

    // 2. ViewModel erstellen (mit StatePort statt Plain Object)
    const viewModel = this.viewModelBuilder.build(
      this.definition,
      this.statePort, // StatePort statt Plain Object
      this.createActions()
    );
    this.cachedViewModel = viewModel;

    // 3. Renderer holen
    const rendererResult = this.rendererRegistry.get(this.definition.component.type);
    if (!rendererResult.ok) return err(rendererResult.error);

    // 4. Mount-Point finden
    const mountPoint: HTMLElement | null = element.querySelector("#svelte-mount-point");
    if (!mountPoint) {
      return err({
        code: "MountPointNotFound",
        message: "Mount point #svelte-mount-point not found",
      });
    }

    // 5. Component mounten
    const mountResult = rendererResult.value.mount(
      this.definition.component,
      mountPoint,
      viewModel
    );
    if (!mountResult.ok) return err(mountResult.error);

    this.componentInstance = mountResult.value;
    this.isMounted = true;

    // 6. Event-Listener registrieren
    this.registerEventListeners();

    // 7. Event emittieren
    this.eventBus.emit("window:rendered", { instanceId: this.instanceId });

    return ok(undefined);
  }

  async onFoundryUpdate(
    _element: HTMLElement
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    // Bei weiteren Renders: Kein Re-Mount, nur Update (wenn nötig)
    // Bei Svelte mit RuneState ist normalerweise kein Update nötig (reaktiv)
    return ok(undefined);
  }

  async onFoundryClose(): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    // 1. Component unmounten
    if (this.componentInstance !== null) {
      const rendererResult = this.rendererRegistry.get(this.definition.component.type);
      if (rendererResult.ok) {
        if (this.componentInstance !== null) {
          rendererResult.value.unmount(this.componentInstance);
        }
      }
      this.componentInstance = null;
    }

    this.isMounted = false;

    // 2. Persistieren (wenn konfiguriert, mit Origin-Meta)
    if (this.definition.persist) {
      const meta = this.remoteSyncGate.makePersistMeta(this.instanceId);
      await this.persist(meta);
    }

    // 3. Event emittieren
    this.eventBus.emit("window:closed", { instanceId: this.instanceId });

    return ok(undefined);
  }

  async updateStateLocal(
    updates: Partial<Record<string, unknown>>,
    options?: {
      persist?: boolean;
      sync?: "none" | "debounced" | "immediate";
    }
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    const { persist = false, sync = "none" } = options ?? {};

    // WICHTIG: EIN Entry-Point für State-Updates.
    // UI ruft immer updateStateLocal(), nicht direkt statePort.patch().
    // State aktualisieren (StatePort aktualisiert automatisch, idempotent)
    this.statePort.patch(updates);

    // Persistieren (wenn gewünscht, mit Origin-Meta)
    if (persist && this.definition.persist) {
      const meta = this.remoteSyncGate.makePersistMeta(this.instanceId);
      const persistResult = await this.persist(meta);
      if (!persistResult.ok) return err(persistResult.error);
    }

    // Bindings synchronisieren (nur wenn Policy es erlaubt)
    if (sync !== "none") {
      const syncResult = await this.bindingEngine.sync(this.instanceId, sync);
      if (!syncResult.ok) return err(syncResult.error);
    }

    // Event emittieren
    for (const [key, value] of Object.entries(updates)) {
      this.eventBus.emit("state:updated", { instanceId: this.instanceId, key, value });
    }

    return ok(undefined);
  }

  async applyRemotePatch(
    updates: Partial<Record<string, unknown>>
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    // State aktualisieren (ohne erneutes Persistieren - verhindert Ping-Pong)
    this.statePort.patch(updates);

    // Event emittieren
    for (const [key, value] of Object.entries(updates)) {
      this.eventBus.emit("state:updated", { instanceId: this.instanceId, key, value });
    }

    return ok(undefined);
  }

  async dispatchAction(
    actionId: string,
    controlId?: string,
    event?: Event
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    const context: ActionContext = {
      windowInstanceId: this.instanceId,
      ...(controlId !== undefined && { controlId }),
      state: this.state,
      ...(event !== undefined && { event }),
    };

    const result = await this.actionDispatcher.dispatch(actionId, context);
    if (!result.ok) return err(result.error);

    return ok(undefined);
  }

  async persist(
    meta?: PersistMeta
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    if (!this.definition.persist) {
      return err({
        code: "NoPersistConfig",
        message: "No persist configuration found",
      });
    }

    if (!this.persistAdapter) {
      return err({
        code: "NoPersistAdapter",
        message: "No persist adapter available",
      });
    }

    const state = this.statePort.get();
    const persistMeta = meta ?? this.remoteSyncGate.makePersistMeta(this.instanceId);
    const result = await this.persistAdapter.save(this.definition.persist, state, persistMeta);
    if (!result.ok) return err(result.error);

    return ok(undefined);
  }

  async restore(): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    if (!this.definition.persist?.restoreOnOpen) {
      return ok(undefined);
    }

    if (!this.persistAdapter) {
      return err({
        code: "NoPersistAdapter",
        message: "No persist adapter available",
      });
    }

    const result = await this.persistAdapter.load(this.definition.persist);
    if (!result.ok) return err(result.error);

    await this.applyRemotePatch(result.value);

    return ok(undefined);
  }

  getViewModel(): ViewModel {
    if (this.cachedViewModel) {
      return this.cachedViewModel;
    }

    return this.viewModelBuilder.build(this.definition, this.statePort, this.createActions());
  }

  private createStatePort(): IWindowState<Record<string, unknown>> {
    // WICHTIG: Engine-agnostisch - nutzt Factory, keine konkrete Implementierung.
    // Die konkrete Implementierung (RuneState, ObservableState, etc.) wird
    // in Infrastructure/Composition Root bestimmt (z.B. basierend auf Renderer-Type).
    const initialStateResult = this.stateStore.getAll(this.instanceId);
    const initialState = initialStateResult.ok ? initialStateResult.value : {};
    return this.statePortFactory.create(this.instanceId, initialState);
  }

  private createActions(): Record<string, () => void> {
    const actions: Record<string, () => void> = {};

    for (const actionDef of this.definition.actions || []) {
      actions[actionDef.id] = () => {
        this.dispatchAction(actionDef.id);
      };
    }

    return actions;
  }

  private registerEventListeners(): void {
    // Event-Listener für Control-Actions registrieren
    this.eventBus.on("control:action", (payload) => {
      if (payload.instanceId === this.instanceId) {
        this.dispatchAction(payload.actionId, payload.controlId, payload.event);
      }
    });
  }
}

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
import type { IBindingEngine } from "@/domain/windows/ports/binding-engine-port.interface";
import type { IViewModelBuilder } from "@/domain/windows/ports/view-model-builder-port.interface";
import type { IEventBus } from "@/domain/windows/ports/event-bus-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { IStatePortFactory } from "../ports/state-port-factory-port.interface";
import type { IWindowStateInitializer } from "../ports/window-state-initializer-port.interface";
import type { IWindowRendererCoordinator } from "../ports/window-renderer-coordinator-port.interface";
import type { IWindowPersistenceCoordinator } from "../ports/window-persistence-coordinator-port.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { JournalOverviewService } from "@/application/services/JournalOverviewService";
import { platformJournalEventPortToken } from "@/application/tokens/domain-ports.tokens";
import { journalOverviewServiceToken } from "@/application/tokens/application.tokens";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { castResolvedService } from "@/application/windows/utils/service-casts";
import { ok, err } from "@/domain/utils/result";

/**
 * WindowController - Facade für Window-Lifecycle-Orchestrierung
 *
 * Verantwortlichkeit: Koordiniert Lifecycle-Schritte (render/update/close).
 * Delegiert spezialisierte Aufgaben an:
 * - WindowStateInitializer: State-Initialisierung
 * - WindowRendererCoordinator: Rendering/Mounting
 * - WindowPersistenceCoordinator: Persistenz
 *
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
  private journalEventRegistrationId?: import("@/domain/ports/events/platform-event-port.interface").EventRegistrationId;

  constructor(
    instanceId: string,
    definitionId: string,
    definition: WindowDefinition,
    private readonly registry: IWindowRegistry,
    private readonly stateStore: IStateStore,
    private readonly statePortFactory: IStatePortFactory,
    private readonly actionDispatcher: IActionDispatcher,
    private readonly bindingEngine: IBindingEngine,
    private readonly viewModelBuilder: IViewModelBuilder,
    private readonly eventBus: IEventBus,
    private readonly remoteSyncGate: IRemoteSyncGate,
    private readonly stateInitializer: IWindowStateInitializer,
    private readonly rendererCoordinator: IWindowRendererCoordinator,
    private readonly persistenceCoordinator: IWindowPersistenceCoordinator,
    private readonly container?: PlatformContainerPort
  ) {
    this.instanceId = instanceId;
    this.definitionId = definitionId;
    this.definition = definition;

    // StatePort erstellen (reaktive State-API)
    this.statePort = this.createStatePort();
  }

  get state(): Readonly<Record<string, unknown>> {
    // Use statePort.get() to get the current state instead of stateStore
    // statePort is the source of truth and is always up-to-date
    return this.statePort.get();
  }

  async onFoundryRender(
    element: HTMLElement
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    if (this.isMounted) {
      // Bereits gemountet - sollte nicht passieren, aber sicherheitshalber
      return ok(undefined);
    }

    this.element = element;

    // 0. Initialize state if not already set (for windows that need initial state)
    const currentState = this.stateStore.getAll(this.instanceId);
    if (currentState.ok && Object.keys(currentState.value).length === 0) {
      // Initialize with state from WindowStateInitializer
      const defaultState = this.stateInitializer.buildInitialState(this.definitionId);
      this.statePort.patch(defaultState);
    }

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

    // 3. Mount-Point finden
    const mountPoint: HTMLElement | null = element.querySelector("#svelte-mount-point");
    if (!mountPoint) {
      return err({
        code: "MountPointNotFound",
        message: "Mount point #svelte-mount-point not found",
      });
    }

    // 4. Component mounten (via WindowRendererCoordinator)
    const mountResult = this.rendererCoordinator.mount(
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

    // 8. Call "onOpen" action if it exists (for initial data loading)
    const onOpenAction = this.definition.actions?.find((a) => a.id === "onOpen");
    if (onOpenAction) {
      // Call asynchronously to not block render
      this.dispatchAction("onOpen").catch((error: unknown) => {
        // Log error but don't fail render
        console.error("Failed to execute onOpen action:", error);
      });
    }

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
    // 1. Journal-Event-Listener entfernen (falls registriert)
    if (this.journalEventRegistrationId && this.container) {
      const journalEventsResult = this.container.resolveWithError(platformJournalEventPortToken);
      if (journalEventsResult.ok) {
        const journalEvents = castResolvedService<PlatformJournalEventPort>(
          journalEventsResult.value
        );
        journalEvents.unregisterListener(this.journalEventRegistrationId);
        delete this.journalEventRegistrationId;
      }
    }

    // 2. Component unmounten (via WindowRendererCoordinator)
    if (this.componentInstance !== null) {
      const unmountResult = this.rendererCoordinator.unmount(
        this.definition.component,
        this.componentInstance
      );
      // Log error but don't fail close (graceful degradation)
      if (!unmountResult.ok) {
        console.error("Failed to unmount component:", unmountResult.error);
      }
      this.componentInstance = null;
    }

    this.isMounted = false;

    // 3. Persistieren (wenn konfiguriert, mit Origin-Meta)
    if (this.definition.persist) {
      const meta = this.remoteSyncGate.makePersistMeta(this.instanceId);
      const state = this.statePort.get();
      await this.persistenceCoordinator.persist(this.definition.persist, state, meta);
      // Log error but don't fail close (graceful degradation)
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
      const state = this.statePort.get();
      const persistResult = await this.persistenceCoordinator.persist(
        this.definition.persist,
        state,
        meta
      );
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
    event?: Event,
    additionalMetadata?: Record<string, unknown>
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    const context: ActionContext = {
      windowInstanceId: this.instanceId,
      ...(controlId !== undefined && { controlId }),
      state: this.state,
      ...(event !== undefined && { event }),
      metadata: {
        controller: this,
        ...(this.container !== undefined && { container: this.container }),
        ...(additionalMetadata !== undefined && additionalMetadata),
      },
    };

    const result = await this.actionDispatcher.dispatch(actionId, context);
    if (!result.ok) {
      return err(result.error);
    }

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

    const state = this.statePort.get();
    const persistMeta = meta ?? this.remoteSyncGate.makePersistMeta(this.instanceId);
    return await this.persistenceCoordinator.persist(this.definition.persist, state, persistMeta);
  }

  async restore(): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    if (!this.definition.persist?.restoreOnOpen) {
      return ok(undefined);
    }

    const result = await this.persistenceCoordinator.restore(this.definition.persist);
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
      // Special handling for journal-overview window actions with parameters
      if (this.definitionId === "journal-overview") {
        if (actionDef.id === "toggleJournalVisibility") {
          // Create action that accepts journalId parameter
          (actions as Record<string, unknown>)[actionDef.id] = (journalId: string) => {
            this.dispatchAction(actionDef.id, undefined, undefined, { journalId });
          };
          continue;
        } else if (actionDef.id === "setSort") {
          // Create action that accepts column parameter
          (actions as Record<string, unknown>)[actionDef.id] = (column: string) => {
            this.dispatchAction(actionDef.id, undefined, undefined, { column });
          };
          continue;
        } else if (actionDef.id === "setColumnFilter") {
          // Create action that accepts column and value parameters
          (actions as Record<string, unknown>)[actionDef.id] = (column: string, value: string) => {
            this.dispatchAction(actionDef.id, undefined, undefined, { column, value });
          };
          continue;
        } else if (actionDef.id === "setGlobalSearch") {
          // Create action that accepts value parameter
          (actions as Record<string, unknown>)[actionDef.id] = (value: string) => {
            this.dispatchAction(actionDef.id, undefined, undefined, { value });
          };
          continue;
        }
      }

      // Default: parameterless action
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

    // Für journal-overview Fenster: Auf Journal-Update-Events hören
    if (this.definitionId === "journal-overview" && this.container) {
      const journalEventsResult = this.container.resolveWithError(platformJournalEventPortToken);
      if (journalEventsResult.ok) {
        const journalEvents = castResolvedService<PlatformJournalEventPort>(
          journalEventsResult.value
        );

        // Listener für Journal-Update-Events registrieren
        const registrationResult = journalEvents.onJournalUpdated((event) => {
          // Prüfe, ob hidden flag geändert wurde
          const moduleId = MODULE_METADATA.ID;
          const flagKey = DOMAIN_FLAGS.HIDDEN;

          const moduleFlags = event.changes.flags?.[moduleId];
          if (moduleFlags && typeof moduleFlags === "object" && flagKey in moduleFlags) {
            // Hidden-Flag wurde geändert - Daten neu laden
            this.reloadJournalOverviewData();
          }
        });

        if (registrationResult.ok) {
          this.journalEventRegistrationId = registrationResult.value;
        }
      }
    }
  }

  /**
   * Lädt die Journal-Übersichtsdaten neu und aktualisiert den State.
   * Wird aufgerufen, wenn sich die Visibility eines Journals ändert.
   */
  private async reloadJournalOverviewData(): Promise<void> {
    if (!this.container) return;

    // Service auflösen
    const serviceResult = this.container.resolveWithError(journalOverviewServiceToken);
    if (!serviceResult.ok) return;

    const service = castResolvedService<JournalOverviewService>(serviceResult.value);

    // Daten neu laden
    const result = service.getAllJournalsWithVisibilityStatus();
    if (result.ok) {
      // State aktualisieren
      await this.updateStateLocal({
        journals: result.value,
      });
    }
  }
}

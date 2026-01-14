/**
 * JournalEntryPageWindowSystemBridgeMixin - Bridge-Mixin für JournalEntryPage Sheet-Erweiterung mit Window-System + DI-Services
 *
 * Erweitert JournalEntryPageHandlebarsSheet mit:
 * - DI-Service-Zugriff über Public API (wie externe Komponenten)
 * - Window-System-Integration (Svelte-Rendering)
 * - Scope-Management für DI-Services
 * - Lifecycle-Integration (Foundry Sheet-Lifecycle)
 *
 * WICHTIG: Sheets werden von Foundry instanziiert, daher verwenden wir Public API
 * statt internen Container-Zugriff (wie externe Komponenten).
 *
 * @example
 * ```typescript
 * const GraphSheetBase = JournalEntryPageWindowSystemBridgeMixin(
 *   JournalEntryPageHandlebarsSheet,
 *   {
 *     definitionId: "relationship-graph-sheet",
 *     component: {
 *       type: "svelte",
 *       component: GraphSheetView,
 *     },
 *   },
 *   "fvtt_relationship_app_module"
 * );
 *
 * export default class RelationshipGraphSheet extends GraphSheetBase {
 *   // Sheet-spezifische Implementierung
 * }
 * ```
 */

import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "@/infrastructure/di/interfaces";
import type { ComponentDescriptor } from "@/domain/windows/types/component-descriptor.interface";
import type { IWindowState } from "@/domain/windows/types/view-model.interface";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { SvelteRenderer } from "@/infrastructure/windows/renderers/svelte-renderer";
import type { SvelteComponentInstance } from "@/domain/windows/types/component-instance.interface";
import type { ViewModel } from "@/domain/windows/types/view-model.interface";

/**
 * ModuleApi - Lokale Type-Definition für Infrastructure-Layer
 *
 * WICHTIG: Diese Type-Definition ist eine lokale Kopie der ModuleApi-Interfaces,
 * um Domain-Boundary-Verletzungen zu vermeiden (Infrastructure darf nicht von Framework importieren).
 *
 * Die tatsächliche Implementierung befindet sich in @/framework/core/api/module-api,
 * aber wir verwenden hier nur die Type-Definitionen für Type-Safety.
 */
interface ServiceResolutionApi {
  resolve: <TServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType;
  resolveWithError: <TServiceType>(
    token: ApiSafeToken<TServiceType>
  ) => Result<TServiceType, ContainerError>;
  tokens: {
    [key: string]: ApiSafeToken<unknown>;
    notificationCenterToken: ApiSafeToken<unknown>;
    graphDataServiceToken: ApiSafeToken<unknown>;
    nodeDataServiceToken: ApiSafeToken<unknown>;
  };
}

/**
 * ModuleApi - Public API Interface
 *
 * Lokale Type-Definition (siehe Kommentar oben).
 * Die tatsächliche Definition befindet sich in @/framework/core/api/module-api.
 *
 * WICHTIG: Diese Type-Definition wird nur für die lokale ServiceResolutionApi verwendet.
 * Die vollständige ModuleApi-Definition ist in Framework, aber wir verwenden hier nur ServiceResolutionApi.
 */

/**
 * Einfacher State-Wrapper für Sheets (vereinfacht, kein vollständiges Window-System)
 */
class SimpleStateWrapper implements IWindowState<Record<string, unknown>> {
  private state: Record<string, unknown> = {};

  get(): Readonly<Record<string, unknown>> {
    return this.state;
  }

  patch(updates: Partial<Record<string, unknown>>): void {
    this.state = { ...this.state, ...updates };
  }

  subscribe(fn: (value: Readonly<Record<string, unknown>>) => void): () => void {
    // Einfache Implementierung: Sofort aufrufen und leere Unsubscribe-Funktion
    fn(this.state);
    return () => {
      // No-op
    };
  }
}

/**
 * Sheet-spezifische Window-Definition (vereinfacht)
 */
export interface SheetWindowDefinition {
  readonly definitionId: string;
  readonly component: ComponentDescriptor;
  readonly title?: string;
}

/**
 * JournalEntryPageWindowSystemBridgeMixin - Erweitert JournalEntryPageHandlebarsSheet mit Window-System + DI
 *
 * @template T - Base Sheet-Klasse (muss JournalEntryPageHandlebarsSheet erweitern)
 * @param BaseSheet - Base Sheet-Klasse
 * @param windowDefinition - Window-Definition für Svelte-Rendering
 * @param moduleId - Module-ID für Public API-Zugriff (default: MODULE_METADATA.ID)
 * @returns Erweiterte Sheet-Klasse mit Window-System + DI-Features
 */
/* eslint-disable @typescript-eslint/naming-convention -- Mixin function names use PascalCase convention */
export function JournalEntryPageWindowSystemBridgeMixin<
  T extends typeof foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet,
>(BaseSheet: T, windowDefinition: SheetWindowDefinition, moduleId: string = MODULE_METADATA.ID): T {
  /* eslint-disable @typescript-eslint/no-explicit-any -- Mixin constructor requires any[] for variadic arguments */
  /* eslint-disable @typescript-eslint/naming-convention -- Mixin class names use PascalCase convention */
  /* @ts-expect-error TS2545 - Mixin pattern: TypeScript requires constructor with any[], but this is a known limitation when extending Foundry classes */
  const MixedClass = class extends BaseSheet {
    // Konstruktor für Mixin-Klasse (TypeScript erfordert explizite Signatur mit any[])
    // type-coverage:ignore-next-line -- Mixin Constructor: Variadic constructor requires any[] for mixin pattern
    constructor(...args: any[]) {
      // type-coverage:ignore-next-line -- Mixin Constructor: Variadic constructor requires any[] for mixin pattern
      super(...args);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // DI-Service-Zugriff über Public API (wie externe Komponenten)
    private get api(): ServiceResolutionApi {
      if (typeof game === "undefined" || !game?.modules) {
        throw new Error("Foundry game API not available");
      }
      const mod = game.modules.get(moduleId);
      if (!mod?.api) {
        throw new Error(`Module API not available: ${moduleId}`);
      }
      // Type assertion: mod.api ist ModuleApi, aber wir verwenden nur ServiceResolutionApi
      // type-coverage:ignore-next-line -- Mixin API Resolution: mod.api is ModuleApi but we only use ServiceResolutionApi subset
      return mod.api as unknown as ServiceResolutionApi;
    }

    // Helper: Service über Public API auflösen (exception-based)
    protected resolveService<TService>(token: ApiSafeToken<TService>): TService {
      return this.api.resolve(token);
    }

    // Alternative: Result-Pattern für explizite Fehlerbehandlung
    protected resolveServiceWithError<TService>(
      token: ApiSafeToken<TService>
    ): Result<TService, ContainerError> {
      return this.api.resolveWithError(token);
    }

    // Window-System-Features
    private svelteRenderer: SvelteRenderer | null = null;
    private componentInstance: SvelteComponentInstance | null = null;
    private isMounted = false;
    // Cache für aktuelle Daten aus Svelte-Komponente (für _updateObject)
    private currentComponentData: Record<string, unknown> | null = null;
    // Services für Validierung (cached)
    private cachedNodeDataService: unknown | null = null;
    private cachedGraphDataService: unknown | null = null;
    // Event-Listener für Save-Button (wird nur einmal hinzugefügt)
    private saveButtonListener: ((event: MouseEvent) => Promise<void>) | null = null;
    // Cache für ursprünglichen Edit-Modus (um nach Update-Re-Render den Modus beizubehalten)
    private cachedIsEditMode: boolean | null = null;
    // Callback für erfolgreiches Speichern (wird von Komponente gesetzt)
    private saveSuccessCallback: (() => void) | null = null;

    /**
     * Überschreibt _onRender für Svelte-Rendering
     *
     * WICHTIG: Wir verwenden _onRender statt _renderFrame, um die Template-Struktur
     * (Header/Footer) zu respektieren. Der Mount-Point sollte zwischen Header und Footer
     * platziert werden, wie in JournalEntryPageRelationshipGraphSheet.
     */
    protected override async _onRender(
      context: foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet.RenderContext,
      options: foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet.RenderOptions
    ): Promise<void> {
      // 1. Foundry's Standard-Rendering durchführen (erstellt Template-Struktur mit Header/Footer)
      await super._onRender(context, options);

      // 2. Prüfe, ob bereits gemountet ist UND ob der Mount-Point noch die Komponente enthält
      // WICHTIG: super._onRender() kann den Mount-Point neu erstellen, wodurch die Komponente verloren geht
      const mountPoint = this.element.querySelector<HTMLElement>("#svelte-mount-point");
      if (!mountPoint) {
        console.warn(
          "[JournalEntryPageWindowSystemBridgeMixin] Mount point #svelte-mount-point not found in template"
        );
        return;
      }

      // Prüfe, ob Mount-Point leer ist (keine Kinder = Komponente wurde entfernt)
      const mountPointIsEmpty = mountPoint.children.length === 0;
      const wasMounted = this.isMounted && this.componentInstance;

      if (wasMounted && !mountPointIsEmpty) {
        // Bereits gemountet UND Mount-Point enthält noch die Komponente: Überspringe Mounting-Logik

        // Nur noch Save-Button-Listener prüfen (falls noch nicht hinzugefügt)
        if (!this.saveButtonListener) {
          const saveButton = this.element.querySelector<HTMLButtonElement>(
            'footer button[type="submit"], footer .form-footer button[type="submit"], button[type="submit"]'
          );
          if (saveButton) {
            this.saveButtonListener = async (event: MouseEvent) => {
              event.preventDefault();
              event.stopPropagation();

              // Hole aktuelle Daten aus der Komponente
              const componentData = this.currentComponentData;
              if (!componentData) {
                console.warn(
                  "[JournalEntryPageWindowSystemBridgeMixin] No component data available for save"
                );
                return;
              }

              // Verwende NodeDataService oder GraphDataService statt direkt document.update()
              // Das folgt der Clean Architecture und nutzt den Repository-Service
              const pageId = this.document.id ?? this.document._id;
              if (!pageId) {
                console.error(
                  "[JournalEntryPageWindowSystemBridgeMixin] No pageId found on document"
                );
                return;
              }

              // Prüfe, welcher Service verfügbar ist (Node oder Graph)
              if (this.cachedNodeDataService) {
                // Node-Daten speichern über NodeDataService
                // type-coverage:ignore-next-line -- Service Type Narrowing: cachedNodeDataService is NodeDataService but type is unknown
                const nodeService = this.cachedNodeDataService as {
                  saveNodeData: (
                    pageId: string,
                    data: unknown
                  ) => Promise<{ ok: boolean; error?: { message?: string } }>;
                };
                const result = await nodeService.saveNodeData(pageId, componentData);
                if (result.ok) {
                  // Benachrichtige Komponente über erfolgreiches Speichern
                  if (this.saveSuccessCallback) {
                    try {
                      this.saveSuccessCallback();
                    } catch (error) {
                      console.error(
                        "[JournalEntryPageWindowSystemBridgeMixin] Error calling saveSuccessCallback:",
                        error
                      );
                    }
                  }
                } else {
                  console.error(
                    "[JournalEntryPageWindowSystemBridgeMixin] Failed to save node data via service:",
                    result.error
                  );
                }
              } else if (this.cachedGraphDataService) {
                // Graph-Daten speichern über GraphDataService
                // type-coverage:ignore-next-line -- Service Type Narrowing: cachedGraphDataService is GraphDataService but type is unknown
                const graphService = this.cachedGraphDataService as {
                  saveGraphData: (
                    pageId: string,
                    data: unknown
                  ) => Promise<{ ok: boolean; error?: { message?: string } }>;
                };
                const result = await graphService.saveGraphData(pageId, componentData);
                if (result.ok) {
                  // Benachrichtige Komponente über erfolgreiches Speichern
                  if (this.saveSuccessCallback) {
                    try {
                      this.saveSuccessCallback();
                    } catch (error) {
                      console.error(
                        "[JournalEntryPageWindowSystemBridgeMixin] Error calling saveSuccessCallback:",
                        error
                      );
                    }
                  }
                } else {
                  console.error(
                    "[JournalEntryPageWindowSystemBridgeMixin] Failed to save graph data via service:",
                    result.error
                  );
                }
              } else {
                // Fallback: Direkt document.update() (sollte nicht vorkommen, aber als Sicherheit)
                console.warn(
                  "[JournalEntryPageWindowSystemBridgeMixin] No service available, using direct document.update() as fallback"
                );
                const updateData: Record<string, unknown> = {
                  system: componentData,
                };
                try {
                  await this.document.update(updateData);
                } catch (error) {
                  console.error(
                    "[JournalEntryPageWindowSystemBridgeMixin] Failed to update document:",
                    error
                  );
                }
              }
            };
            saveButton.addEventListener("click", this.saveButtonListener);
          }
        }
        // Bereits gemountet: Überspringe die gesamte Mounting-Logik
        return;
      }

      // 3. Wenn Mount-Point leer ist, aber wir vorher gemountet hatten, müssen wir erneut mounten
      if (wasMounted && mountPointIsEmpty) {
        // Setze isMounted zurück, damit die Komponente neu gemountet wird
        this.isMounted = false;
        this.componentInstance = null;
      }

      // 4. Svelte-Renderer initialisieren (einmalig)
      if (!this.svelteRenderer) {
        this.svelteRenderer = new SvelteRenderer();
      }

      // 5. Services über Public API auflösen (für beide Sheet-Typen)
      let graphDataService: unknown = null;
      let nodeDataService: unknown = null;
      let notificationCenter: unknown = null;

      try {
        graphDataService = this.resolveService(this.api.tokens.graphDataServiceToken);
        this.cachedGraphDataService = graphDataService;
      } catch (_error) {
        // GraphDataService nur für Graph-Sheet nötig, daher optional
      }

      try {
        nodeDataService = this.resolveService(this.api.tokens.nodeDataServiceToken);
        this.cachedNodeDataService = nodeDataService;
      } catch (_error) {
        // NodeDataService nur für Node-Sheet nötig, daher optional
      }

      try {
        notificationCenter = this.resolveService(this.api.tokens.notificationCenterToken);
      } catch (error) {
        console.warn("Failed to resolve notificationCenter:", error);
      }

      // 6. ViewModel erstellen (mit Services)
      const stateWrapper = new SimpleStateWrapper();
      // type-coverage:ignore-next-line -- ViewModel Creation: Type assertion needed for ViewModel with service extensions
      const viewModel: ViewModel = {
        document: this.document,
        state: stateWrapper,
        computed: {},
        actions: {},
        // Services als Props übergeben (beide für Flexibilität)
        // Diese werden über das ViewModel als Props an die Komponente übergeben
      } as ViewModel & {
        graphDataService?: unknown;
        nodeDataService?: unknown;
        notificationCenter?: unknown;
      };

      // Services als zusätzliche Props hinzufügen (nicht Teil des ViewModel-Interfaces, aber als Props verfügbar)
      // type-coverage:ignore-next-line -- ViewModel Extension: Adding dynamic service props to ViewModel
      const viewModelWithServices = viewModel as unknown as ViewModel & Record<string, unknown>;
      viewModelWithServices.graphDataService = graphDataService;
      viewModelWithServices.nodeDataService = nodeDataService;
      viewModelWithServices.notificationCenter = notificationCenter;

      // View/Edit-Modus erkennen basierend auf gerendertem Template
      // WICHTIG: Mehrere Sheet-Instanzen können gleichzeitig existieren (View im Journal-Fenster, Edit in separatem Fenster)
      // Daher bestimmen wir den Modus dynamisch basierend auf dem Save-Button, nicht über einen Cache
      const hasSaveButton =
        this.element.querySelector('footer button[type="submit"], button[type="submit"]') !== null;

      // Bestimme Modus: Save-Button ist der zuverlässigste Indikator für Edit-Modus
      // Wenn Save-Button vorhanden ist, sind wir definitiv im Edit-Modus
      // Wenn kein Save-Button, aber Cache vorhanden (für diese Instanz), verwende Cache als Fallback
      // type-coverage:ignore-next-line -- Foundry Sheet Property: isView is a Foundry sheet property not in type definition
      const sheetWithView = this as { isView?: boolean };
      const contextEditable = (context as { editable?: boolean }).editable;
      const thisIsEditable = (this as { isEditable?: boolean }).isEditable;
      const isViewFromFoundry = sheetWithView.isView === true;

      let isEditMode: boolean;
      if (hasSaveButton) {
        // Save-Button vorhanden = Edit-Modus (zuverlässigster Indikator)
        isEditMode = true;
        // Cache für diese Instanz setzen (für zukünftige Renders dieser Instanz)
        this.cachedIsEditMode = true;
      } else if (this.cachedIsEditMode === true) {
        // Cache vorhanden und true: Diese Instanz war vorher im Edit-Modus
        // Verwende Cache (z.B. wenn Save-Button noch nicht gerendert wurde)
        isEditMode = true;
      } else {
        // Kein Save-Button und kein Cache: Bestimme Modus aus Foundry-Flags
        isEditMode = isViewFromFoundry
          ? false
          : thisIsEditable === true || contextEditable === true;
        // Cache nur setzen, wenn wir im Edit-Modus sind (für diese Instanz)
        if (isEditMode) {
          this.cachedIsEditMode = true;
        } else {
          // View-Modus: Cache explizit auf false setzen (nicht null)
          this.cachedIsEditMode = false;
        }
      }

      const readonly = !isEditMode;

      // readonly-Prop an Komponente übergeben
      viewModelWithServices.readonly = readonly;

      // Callback für Datenänderungen (für _updateObject)
      // Die Komponente kann über onDataChange ihre aktuellen Daten an uns übergeben
      viewModelWithServices.onDataChange = (data: Record<string, unknown>) => {
        this.currentComponentData = data;
      };

      // Callback für erfolgreiches Speichern (um hasUnsavedChanges zurückzusetzen)
      // Die Komponente kann diese Funktion aufrufen, um den Callback zu registrieren
      viewModelWithServices.onSaveSuccess = (callback: () => void) => {
        this.saveSuccessCallback = callback;
      };

      // 7. Component mounten (nur beim ersten Render, da wir bereits oben prüfen)
      const finalMountPoint = this.element.querySelector<HTMLElement>("#svelte-mount-point");
      if (!finalMountPoint) {
        console.warn(
          "[JournalEntryPageWindowSystemBridgeMixin] Mount point not found after creation"
        );
        return;
      }

      // Component mounten (nur beim ersten Render, da wir bereits oben prüfen)
      const mountResult = this.svelteRenderer.mount(
        windowDefinition.component,
        finalMountPoint,
        viewModelWithServices
      );

      if (mountResult.ok) {
        this.componentInstance = mountResult.value;
        this.isMounted = true;
      } else {
        // Fehler beim Mounten - Fehlermeldung anzeigen
        try {
          const notificationCenter = this.resolveService(this.api.tokens.notificationCenterToken);
          // type-coverage:ignore-next-line -- Notification Center Type: resolveService returns unknown, but we know it's NotificationCenter
          (notificationCenter as { error: (message: string, error?: unknown) => void }).error(
            `Failed to mount component: ${mountResult.error.message}`,
            mountResult.error
          );
        } catch (_error) {
          // NotificationCenter nicht verfügbar - logge nur in Konsole
          console.error("Failed to mount component:", mountResult.error);
        }
      }

      // 8. Event-Listener für Save-Button hinzufügen (nur einmal, falls _updateObject nicht aufgerufen wird)
      // Foundry's Save-Button hat normalerweise type="submit" und ist im Footer
      if (!this.saveButtonListener) {
        const saveButton = this.element.querySelector<HTMLButtonElement>(
          'footer button[type="submit"], footer .form-footer button[type="submit"], button[type="submit"]'
        );
        if (saveButton) {
          this.saveButtonListener = async (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            // Hole aktuelle Daten aus der Komponente
            const componentData = this.currentComponentData;
            if (!componentData) {
              console.warn(
                "[JournalEntryPageWindowSystemBridgeMixin] No component data available for save"
              );
              return;
            }

            // Verwende NodeDataService oder GraphDataService statt direkt document.update()
            // Das folgt der Clean Architecture und nutzt den Repository-Service
            const pageId = this.document.id ?? this.document._id;
            if (!pageId) {
              console.error(
                "[JournalEntryPageWindowSystemBridgeMixin] No pageId found on document"
              );
              return;
            }

            // Prüfe, welcher Service verfügbar ist (Node oder Graph)
            if (this.cachedNodeDataService) {
              // Node-Daten speichern über NodeDataService
              // type-coverage:ignore-next-line -- Service Type Narrowing: cachedNodeDataService is NodeDataService but type is unknown
              const nodeService = this.cachedNodeDataService as {
                saveNodeData: (
                  pageId: string,
                  data: unknown
                ) => Promise<{ ok: boolean; error?: { message?: string } }>;
              };
              const result = await nodeService.saveNodeData(pageId, componentData);
              if (result.ok) {
                // Benachrichtige Komponente über erfolgreiches Speichern
                if (this.saveSuccessCallback) {
                  try {
                    this.saveSuccessCallback();
                  } catch (error) {
                    console.error(
                      "[JournalEntryPageWindowSystemBridgeMixin] Error calling saveSuccessCallback:",
                      error
                    );
                  }
                }
              } else {
                console.error(
                  "[JournalEntryPageWindowSystemBridgeMixin] Failed to save node data via service:",
                  result.error
                );
              }
            } else if (this.cachedGraphDataService) {
              // Graph-Daten speichern über GraphDataService
              // type-coverage:ignore-next-line -- Service Type Narrowing: cachedGraphDataService is GraphDataService but type is unknown
              const graphService = this.cachedGraphDataService as {
                saveGraphData: (
                  pageId: string,
                  data: unknown
                ) => Promise<{ ok: boolean; error?: { message?: string } }>;
              };
              const result = await graphService.saveGraphData(pageId, componentData);
              if (result.ok) {
                // Benachrichtige Komponente über erfolgreiches Speichern
                if (this.saveSuccessCallback) {
                  try {
                    this.saveSuccessCallback();
                  } catch (error) {
                    console.error(
                      "[JournalEntryPageWindowSystemBridgeMixin] Error calling saveSuccessCallback:",
                      error
                    );
                  }
                }
              } else {
                console.error(
                  "[JournalEntryPageWindowSystemBridgeMixin] Failed to save graph data via service:",
                  result.error
                );
              }
            } else {
              // Fallback: Direkt document.update() (sollte nicht vorkommen, aber als Sicherheit)
              console.warn(
                "[JournalEntryPageWindowSystemBridgeMixin] No service available, using direct document.update() as fallback"
              );
              const updateData: Record<string, unknown> = {
                system: componentData,
              };
              try {
                await this.document.update(updateData);
              } catch (error) {
                console.error(
                  "[JournalEntryPageWindowSystemBridgeMixin] Failed to update document:",
                  error
                );
              }
            }
          };
          saveButton.addEventListener("click", this.saveButtonListener);
        } else {
          console.warn("[JournalEntryPageWindowSystemBridgeMixin] Save button not found in footer");
        }
      }
    }

    /**
     * Überschreibt _updateObject für Form-Submission
     *
     * WICHTIG: Diese Methode wird von Foundry's Standard-Save-Button aufgerufen.
     * Wir holen die aktuellen Daten aus der Svelte-Komponente und schreiben sie
     * in updateData.system, damit Foundry sie speichern kann.
     *
     * NOTE: Foundry V11 verwendet möglicherweise eine andere Methode. Falls _updateObject
     * nicht existiert, müssen wir _onSubmit oder eine ähnliche Methode überschreiben.
     */
    protected async _updateObject(
      event: Event,
      formData: FormData | Record<string, unknown>
    ): Promise<void> {
      // 1. Hole aktuelle Daten aus der Svelte-Komponente
      const componentData = this.currentComponentData;

      // 2. Konvertiere formData zu Record (falls es FormData ist)
      let updateData: Record<string, unknown>;
      if (formData instanceof FormData) {
        // FormData zu Record konvertieren
        updateData = {};
        // FormData.forEach() ist die TypeScript-kompatible Methode
        formData.forEach((value, key) => {
          updateData[key] = value;
        });
      } else {
        updateData = formData as Record<string, unknown>;
      }

      // 3. Wenn wir Daten aus der Komponente haben, verwende den Service statt direkt document.update()
      if (componentData) {
        const pageId = this.document.id ?? this.document._id;
        if (!pageId) {
          console.error("[JournalEntryPageWindowSystemBridgeMixin] No pageId found on document");
          return;
        }

        // Verwende NodeDataService oder GraphDataService statt direkt document.update()
        // Das folgt der Clean Architecture und nutzt den Repository-Service
        if (this.cachedNodeDataService) {
          // Node-Daten speichern über NodeDataService
          // type-coverage:ignore-next-line -- Service Type Narrowing: cachedNodeDataService is NodeDataService but type is unknown
          const nodeService = this.cachedNodeDataService as {
            saveNodeData: (
              pageId: string,
              data: unknown
            ) => Promise<{ ok: boolean; error?: { message?: string } }>;
          };
          const result = await nodeService.saveNodeData(pageId, componentData);
          if (result.ok) {
            // Benachrichtige Komponente über erfolgreiches Speichern
            if (this.saveSuccessCallback) {
              try {
                this.saveSuccessCallback();
              } catch (error) {
                console.error(
                  "[JournalEntryPageWindowSystemBridgeMixin] Error calling saveSuccessCallback:",
                  error
                );
              }
            }
          } else {
            console.error(
              "[JournalEntryPageWindowSystemBridgeMixin] Failed to save node data via service:",
              result.error
            );
          }
          return; // Service hat gespeichert, kein weiteres Update nötig
        } else if (this.cachedGraphDataService) {
          // Graph-Daten speichern über GraphDataService
          // type-coverage:ignore-next-line -- Service Type Narrowing: cachedGraphDataService is GraphDataService but type is unknown
          const graphService = this.cachedGraphDataService as {
            saveGraphData: (
              pageId: string,
              data: unknown
            ) => Promise<{ ok: boolean; error?: { message?: string } }>;
          };
          const result = await graphService.saveGraphData(pageId, componentData);
          if (result.ok) {
            // Benachrichtige Komponente über erfolgreiches Speichern
            if (this.saveSuccessCallback) {
              try {
                this.saveSuccessCallback();
              } catch (error) {
                console.error(
                  "[JournalEntryPageWindowSystemBridgeMixin] Error calling saveSuccessCallback:",
                  error
                );
              }
            }
          } else {
            console.error(
              "[JournalEntryPageWindowSystemBridgeMixin] Failed to save graph data via service:",
              result.error
            );
          }
          return; // Service hat gespeichert, kein weiteres Update nötig
        } else {
          // Fallback: Direkt document.update() (sollte nicht vorkommen)
          console.warn(
            "[JournalEntryPageWindowSystemBridgeMixin] No service available, using direct document.update() as fallback"
          );
          updateData.system = componentData;
          try {
            await this.document.update(updateData);
          } catch (error) {
            console.error(
              "[JournalEntryPageWindowSystemBridgeMixin] Failed to update document:",
              error
            );
            throw error;
          }
          return;
        }
      }

      // 4. Wenn keine Component-Daten vorhanden, normalen Foundry-Update-Flow durchführen
      // @ts-expect-error TS2339 - _updateObject may not exist in base class type definition but exists at runtime
      await super._updateObject(event, formData);
    }

    /**
     * Überschreibt close für Cleanup
     */
    override async close(options?: {
      animate?: boolean;
      closeKey?: boolean;
      submitted?: boolean;
    }): Promise<this> {
      // 1. Component unmounten
      if (this.isMounted && this.componentInstance && this.svelteRenderer) {
        const unmountResult = this.svelteRenderer.unmount(this.componentInstance);
        if (!unmountResult.ok) {
          // Fehler beim Unmounten - loggen, aber nicht abbrechen
          console.warn("Failed to unmount component:", unmountResult.error.message);
        }
        this.componentInstance = null;
        this.isMounted = false;
      }

      // 2. Daten-Cache zurücksetzen
      this.currentComponentData = null;

      // 3. Modus-Cache zurücksetzen
      this.cachedIsEditMode = null;

      // 4. Event-Listener entfernen (falls vorhanden)
      if (this.saveButtonListener) {
        const saveButton = this.element.querySelector<HTMLButtonElement>(
          'footer button[type="submit"], footer .form-footer button[type="submit"], button[type="submit"]'
        );
        if (saveButton) {
          saveButton.removeEventListener("click", this.saveButtonListener);
        }
        this.saveButtonListener = null;
      }

      // 5. Save-Success-Callback zurücksetzen
      this.saveSuccessCallback = null;

      // 6. Foundry's close aufrufen
      return super.close(options);
    }
  };

  return MixedClass as T;
}
/* eslint-enable @typescript-eslint/naming-convention */

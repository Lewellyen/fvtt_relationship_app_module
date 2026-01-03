import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type {
  ApplicationClass,
  ApplicationV2,
} from "@/domain/windows/types/application-v2.interface";

/**
 * FoundryApplicationWrapper - Dünne ApplicationV2-Wrapper-Klasse
 *
 * Erstellt eine dünne ApplicationV2-Klasse, die an WindowController delegiert.
 * Controller wird via WeakMap gespeichert (kein Memory-Leak).
 *
 * WICHTIG:
 * - instanceId muss übergeben werden (nicht definitionId) für Multi-Instance-Support.
 * - build() erzeugt pro Instance eine eigene Class (DEFAULT_OPTIONS.id = instanceId).
 * - WeakMap key = App instance, daher bleibt es sauber auch bei mehreren Instanzen derselben Class.
 */
export class FoundryApplicationWrapper {
  // Expose WeakMaps for testing (only in test environment)
  // This allows tests to manipulate the maps to test edge cases
  static readonly _testControllerMaps = new Map<
    ApplicationV2,
    WeakMap<ApplicationV2, IWindowController>
  >();
  static readonly _testMountedMaps = new Map<ApplicationV2, WeakMap<ApplicationV2, boolean>>();

  static build(
    definition: WindowDefinition,
    controller: IWindowController,
    instanceId: string
  ): ApplicationClass {
    const controllerMap = new WeakMap<ApplicationV2, IWindowController>();
    const mountedMap = new WeakMap<ApplicationV2, boolean>();

    const foundryApi = foundry;
    const applicationBase = foundryApi.applications.api.ApplicationV2 ?? class {};
    const handlebarsMixin =
      foundryApi.applications.api.HandlebarsApplicationMixin ?? ((cls: unknown) => cls);

    const appClass = class extends handlebarsMixin(applicationBase) {
      static override DEFAULT_OPTIONS = {
        id: instanceId, // WICHTIG: instanceId, nicht definitionId!
        title: definition.title,
        classes: definition.classes || [],
        window: {
          resizable: definition.features?.resizable ?? true,
          minimizable: definition.features?.minimizable ?? true,
          draggable: definition.features?.draggable ?? true,
        },
        ...(definition.position && {
          position: {
            ...(definition.position.top !== undefined && { top: definition.position.top }),
            ...(definition.position.left !== undefined && { left: definition.position.left }),
            ...(definition.position.width !== undefined && { width: definition.position.width }),
            ...(definition.position.height !== undefined && { height: definition.position.height }),
          },
        }),
      };

      static template = '<div id="svelte-mount-point"></div>';

      constructor(options?: {
        id?: string;
        uniqueId?: string;
        classes?: string[];
        tag?: string;
        window?: {
          frame?: boolean;
          positioned?: boolean;
          title?: string;
          icon?: string | false;
          controls?: unknown[] | boolean;
          minimizable?: boolean;
          resizable?: boolean;
          contentTag?: string;
          contentClasses?: string[];
        };
        actions?: unknown;
        form?: unknown;
        tabs?: unknown;
        scrollY?: unknown[];
        filters?: unknown;
        dragDrop?: unknown[];
        popOut?: boolean;
        editable?: boolean;
        closeOnSubmit?: boolean;
        submitOnChange?: boolean;
        submitOnClose?: boolean;
      }) {
        // Type-safe cast: Foundry ApplicationV2 constructor accepts these options
        // The options type matches Foundry's ApplicationV2Options structure
        // We use a type assertion here because Foundry's ApplicationV2 constructor accepts
        // a flexible options object that varies by application type, and our options
        // structure is compatible with the expected type
        // Using Record<string, unknown> instead of any for better type safety
        // type-coverage:ignore-next-line
        super(options as Record<string, unknown>);
        // Controller-Reference speichern
        const appInstance = this as ApplicationV2;
        controllerMap.set(appInstance, controller);
        mountedMap.set(appInstance, false);

        // Store WeakMaps for testing (only in test environment)
        // This allows tests to access and manipulate the maps
        if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
          FoundryApplicationWrapper._testControllerMaps.set(appInstance, controllerMap);
          FoundryApplicationWrapper._testMountedMaps.set(appInstance, mountedMap);
        }
      }

      // Verwendet _onRender lifecycle method (Best Practice für ApplicationV2)
      // Wird nach dem Rendering aufgerufen, wenn das HTML bereits im DOM ist
      protected override async _onRender(
        context: Record<string, unknown>,
        options: Record<string, unknown>
      ): Promise<void> {
        // Type-safe cast: Foundry ApplicationV2._onRender accepts these parameters
        // The context and options are runtime objects from Foundry's render system
        // We use a type assertion here because Foundry's _onRender method accepts flexible
        // context and options objects that vary by application type, and our Record types
        // are compatible with the expected structure
        // Using Record<string, unknown> instead of any for better type safety
        await super._onRender(
          context as Record<string, unknown>,
          options as Record<string, unknown>
        );

        const ctrl = controllerMap.get(this as ApplicationV2);
        const isMounted = mountedMap.get(this as ApplicationV2) ?? false;
        // type-coverage:ignore-next-line
        const element = (this as unknown as { element?: HTMLElement }).element;

        if (ctrl && element) {
          if (!isMounted) {
            // Erstes Render: Mount
            await ctrl.onFoundryRender(element);
            mountedMap.set(this as ApplicationV2, true);
          } else {
            // Weitere Renders: Update (kein Re-Mount)
            await ctrl.onFoundryUpdate(element);
          }
        }
      }

      override async close(options?: {
        animate?: boolean;
        closeKey?: boolean;
        submitted?: boolean;
      }): Promise<this> {
        const ctrl = controllerMap.get(this as ApplicationV2);
        if (ctrl) {
          await ctrl.onFoundryClose();
        }

        mountedMap.set(this as ApplicationV2, false);
        await super.close(options);
        return this;
      }
    };

    // type-coverage:ignore-next-line
    return appClass as ApplicationClass;
  }
}

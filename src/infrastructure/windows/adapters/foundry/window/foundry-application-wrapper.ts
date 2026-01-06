import type {
  WindowDefinition,
  WindowPosition,
} from "@/domain/windows/types/window-definition.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type {
  ApplicationClass,
  ApplicationV2,
} from "@/domain/windows/types/application-v2.interface";

/**
 * Helper function to build position object with only defined properties.
 * Reduces branches in DEFAULT_OPTIONS construction for better testability.
 *
 * @internal Exported for testing purposes only
 */
export function buildPositionObject(
  position: WindowPosition | undefined
): Record<string, number> | undefined {
  if (!position) return undefined;

  const result: Record<string, number> = {};
  if (position.top !== undefined) result.top = position.top;
  if (position.left !== undefined) result.left = position.left;
  if (position.width !== undefined) result.width = position.width;
  if (position.height !== undefined) result.height = position.height;

  return Object.keys(result).length > 0 ? result : undefined;
}

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

    // Build position object once to avoid duplicate calls and reduce branches
    const positionObj = buildPositionObject(definition.position);

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
        ...(positionObj && { position: positionObj }),
      };

      // Kein static template - wir rendern direkt in _renderFrame
      // static template wird nicht verwendet, da _renderHTML "" zurückgibt

      // Override title getter (wie in Referenz-Implementierung)
      override get title(): string {
        return definition.title ?? "";
      }

      constructor(...args: unknown[]) {
        // Type-safe cast: Foundry ApplicationV2 constructor accepts these options
        // The options type matches Foundry's ApplicationV2Options structure
        // We use a type assertion here because Foundry's ApplicationV2 constructor accepts
        // a flexible options object that varies by application type, and our options
        // structure is compatible with the expected type
        // Using Record<string, unknown> instead of any for better type safety
        // type-coverage:ignore-next-line
        super(...(args as [Record<string, unknown>]));
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

      // Überschreibt _renderHTML um kein Handlebars-Template zu rendern
      // (wie in SvelteApplicationMixin - gibt leeren String zurück)
      protected override async _renderHTML(
        _context: Record<string, unknown>,
        _options: Record<string, unknown>
      ): Promise<Record<string, HTMLElement>> {
        // Type-safe cast: Foundry ApplicationV2._renderHTML accepts these parameters
        // We use a type assertion here because Foundry's _renderHTML method accepts flexible
        // context and options objects that vary by application type, and our Record types
        // are compatible with the expected structure
        // Using Record<string, unknown> instead of any for better type safety
        // Leeres Objekt zurückgeben - kein Handlebars-Template wird gerendert
        // Die Svelte-Komponente wird direkt in _renderFrame gemountet
        return {};
      }

      // Verwendet _renderFrame lifecycle method (wie SvelteApplicationMixin)
      // Wird während des Rendering-Prozesses aufgerufen und gibt den Frame zurück
      // Dies ermöglicht es, die Svelte-Komponente in .window-content zu mounten
      protected override async _renderFrame(
        options: Record<string, unknown>
      ): Promise<HTMLElement> {
        // Type-safe cast: Foundry ApplicationV2._renderFrame accepts these parameters
        // The options are runtime objects from Foundry's render system
        // We use a type assertion here because Foundry's _renderFrame method accepts flexible
        // options objects that vary by application type, and our Record type
        // is compatible with the expected structure
        // Using Record<string, unknown> instead of any for better type safety

        // 1. Foundry's Standard-Rendering durchführen (erstellt Frame mit .window-content)
        const frame = await super._renderFrame(options as Record<string, unknown>);

        // 2. Target-Element finden (.window-content innerhalb des Frames)
        // type-coverage:ignore-next-line
        const hasFrame = (this as unknown as { hasFrame?: boolean }).hasFrame ?? true;
        const target = hasFrame
          ? (frame.querySelector(".window-content") as HTMLElement | null)
          : (frame as HTMLElement);

        if (!target) {
          // Fallback: Wenn kein .window-content gefunden, Frame zurückgeben
          return frame;
        }

        // 3. Target leeren und Mount-Point erstellen (wie in SvelteApplicationMixin)
        target.innerHTML = '<div id="svelte-mount-point"></div>';

        // 4. Controller holen
        const ctrl = controllerMap.get(this as ApplicationV2);
        const isMounted = mountedMap.get(this as ApplicationV2) ?? false;

        // 5. WindowController aufrufen für Mounting/Update
        if (ctrl) {
          if (!isMounted) {
            // Erstes Render: Mount
            await ctrl.onFoundryRender(target);
            mountedMap.set(this as ApplicationV2, true);
          } else {
            // Weitere Renders: Update (kein Re-Mount)
            await ctrl.onFoundryUpdate(target);
          }
        }

        // 6. Frame zurückgeben (wichtig für Foundry's Rendering-Pipeline)
        return frame;
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

    return appClass as ApplicationClass;
  }
}

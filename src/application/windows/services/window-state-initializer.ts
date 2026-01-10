import type { IWindowStateInitializer } from "../ports/window-state-initializer-port.interface";
import type { IWindowDefaultStateProviderRegistry } from "./window-default-state-provider-registry.interface";
import { DefaultWindowStateInitializer } from "./default-window-state-initializer";
import { windowDefaultStateProviderRegistryToken } from "../tokens/window.tokens";

/**
 * WindowStateInitializer - Composite-Strategie für State-Initialisierung
 *
 * Verantwortlichkeit: Wählt die passende State-Initialisierungs-Strategie basierend auf definitionId.
 * Verwendet Registry-basiertes Strategy-Pattern für Feature-spezifische Initialisierung.
 *
 * Implements Open/Closed Principle: Neue Window-Default-States können durch Registrierung
 * neuer Provider hinzugefügt werden, ohne diese Klasse zu modifizieren.
 */
export class WindowStateInitializer implements IWindowStateInitializer {
  static dependencies = [windowDefaultStateProviderRegistryToken] as const;

  private readonly defaultInitializer = new DefaultWindowStateInitializer();

  constructor(private readonly providerRegistry: IWindowDefaultStateProviderRegistry) {}

  buildInitialState(definitionId: string): Record<string, unknown> {
    // Prüfe, ob ein spezifischer Provider für diese definitionId registriert ist
    const provider = this.providerRegistry.get(definitionId);
    if (provider) {
      return provider.buildInitialState(definitionId);
    }

    // Fallback: Standard-Initialisierung für alle anderen Windows
    return this.defaultInitializer.buildInitialState(definitionId);
  }
}

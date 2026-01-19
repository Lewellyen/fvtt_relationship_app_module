/**
 * Domain-level opaque DOM types.
 *
 * The Domain layer must not reference concrete DOM types like `HTMLElement` or `Event`.
 * We model them as minimal structural interfaces and let Infrastructure provide the concrete runtime objects.
 */
export interface DomElement {
  /**
   * Minimal subset used by the Window framework for mounting.
   * Concrete implementations (HTMLElement) provide this at runtime.
   */
  querySelector?<T = unknown>(selector: string): T | null;
}

export interface DomEvent {
  readonly type?: string;
}

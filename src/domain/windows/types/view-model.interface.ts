/**
 * ViewModel - Props-Strategie: UI bekommt ViewModel
 *
 * ViewModel ist die Schnittstelle zwischen WindowController und UI-Komponenten.
 * Es stellt State, computed values, actions und Helper bereit.
 */
export interface ViewModel {
  readonly state: IWindowState<Record<string, unknown>>; // State-API (kann reaktiv sein, nicht Plain Object)
  readonly computed: Readonly<Record<string, unknown>>; // Abgeleitete Werte
  readonly actions: Readonly<Record<string, () => void>>; // Callable functions
  readonly i18n?: I18nHelper;
  readonly logger?: Logger;
  readonly bus?: IEventBus;
}

/**
 * StatePort für reaktive State-Verwaltung (Svelte-first, aber engine-agnostisch)
 *
 * **Reaktivität ist eine Eigenschaft der konkreten Implementierung:**
 * - RuneState (Svelte): gibt **bewusst** den reaktiven $state-Proxy zurück (als Readonly<T> typisiert).
 *   Dieser darf von Svelte-Komponenten direkt gelesen und gebunden werden.
 * - ObservableState: kann EventEmitter-basiert sein
 * - PlainState: kann ein einfaches Objekt sein
 *
 * ACHTUNG:
 * - Nicht serialisieren (wenn Proxy)
 * - Nicht tief klonen (wenn Proxy)
 * - Für Non-Svelte Engines snapshot() verwenden
 */
export interface IWindowState<T = Record<string, unknown>> {
  /**
   * Holt den aktuellen State.
   *
   * **Reaktivität ist eine Eigenschaft der konkreten Implementierung:**
   * - RuneState (Svelte): gibt **bewusst** den reaktiven $state-Proxy zurück (als Readonly<T> typisiert).
   *   Dieser darf von Svelte-Komponenten direkt gelesen und gebunden werden.
   * - ObservableState: kann EventEmitter-basiert sein
   * - PlainState: kann ein einfaches Objekt sein
   *
   * ACHTUNG:
   * - Nicht serialisieren (wenn Proxy)
   * - Nicht tief klonen (wenn Proxy)
   * - Für Non-Svelte Engines snapshot() verwenden
   */
  get(): Readonly<T>;

  /**
   * Aktualisiert State (idempotent: nur ändern wenn value differs).
   */
  patch(updates: Partial<T>): void;

  /**
   * Registriert einen Listener für State-Änderungen.
   *
   * **Reaktivität ist implementierungsabhängig:**
   * - RuneState (Svelte): Für Svelte **nicht** für UI-Reaktivität gedacht (Svelte reagiert automatisch auf $state).
   *   Primär für Logging/Debug.
   * - ObservableState: subscribe() ist der primäre Mechanismus für Reaktivität.
   * - PlainState: subscribe() kann EventBus-basiert sein.
   */
  subscribe(fn: (value: Readonly<T>) => void): () => void; // Unsubscribe-Funktion

  /**
   * Optional: Erstellt einen strukturierten Snapshot (für Non-Svelte Engines).
   */
  snapshot?(): Readonly<T>;
}

import type { IEventBus } from "../ports/event-bus-port.interface";

/**
 * I18nHelper - Helper für Internationalisierung
 */
export interface I18nHelper {
  translate(key: string, fallback?: string): string;
  format(key: string, data: Record<string, unknown>, fallback?: string): string;
}

/**
 * Logger - Logger-Interface für ViewModel
 */
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

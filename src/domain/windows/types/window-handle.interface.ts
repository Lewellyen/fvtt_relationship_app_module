import type { Result } from "@/domain/types/result";
import type { WindowError } from "./errors/window-error.interface";
import type { WindowDefinition } from "./window-definition.interface";
import type { IWindowController } from "../ports/window-controller-port.interface";
import type { ComponentInstance } from "./component-instance.interface";
import type { ApplicationV2 } from "./application-v2.interface";
import type { DomElement } from "./dom.types";

/**
 * WindowHandle - Public API für Window-Manipulation
 */
export interface WindowHandle {
  readonly instanceId: string; // Eindeutig: `${definitionId}:${instanceKey || uuid}`
  readonly definitionId: string; // Referenz auf Definition
  readonly controller: IWindowController; // Besitzt Controller
  readonly definition: Readonly<WindowDefinition>;

  show(): Promise<Result<void, WindowError>>;
  hide(): Promise<Result<void, WindowError>>;
  close(): Promise<Result<void, WindowError>>;
  update(state: Partial<Record<string, unknown>>): Promise<Result<void, WindowError>>;
  persist(): Promise<Result<void, WindowError>>;
  restore(): Promise<Result<void, WindowError>>;
}

/**
 * WindowInstance - Interne Repräsentation einer Window-Instanz
 */
export interface WindowInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly foundryApp?: ApplicationV2; // Referenz (nicht besessen)
  readonly element?: DomElement; // Referenz (nicht besessen)
  readonly componentInstance?: ComponentInstance; // Besessen von Controller
  readonly controller?: IWindowController; // Referenz für Hook-Bridge (optional für MVP)
}

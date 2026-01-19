/**
 * WindowEventMap - Typisiertes Event-System für Window-Framework
 *
 * Alle Events im Window-Framework müssen in diesem Map definiert werden.
 * Das gewährleistet Type-Safety bei emit() und on() Aufrufen.
 */
export interface WindowEventMap {
  "window:created": { instanceId: string; definitionId: string };
  "window:rendered": { instanceId: string };
  "window:closed": { instanceId: string };
  "control:action": { instanceId: string; controlId: string; actionId: string; event?: DomEvent };
  "control:changed": { instanceId: string; controlId: string; value: unknown };
  "action:completed": { instanceId: string; actionId: string; success: boolean };
  "action:failed": { instanceId: string; actionId: string; error: ActionError };
  "state:updated": { instanceId: string; key: string; value: unknown };
  "binding:synced": { instanceId: string; bindingId: string };
}

// Forward declaration
import type { ActionError } from "./errors/action-error.interface";
import type { DomEvent } from "./dom.types";

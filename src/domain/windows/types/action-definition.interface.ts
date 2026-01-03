import type { Result } from "@/domain/types/result";
import type { ActionError } from "./errors/action-error.interface";

/**
 * ActionDefinition - Schema für eine Action (Command-Pattern)
 */
export interface ActionDefinition {
  readonly id: string;
  readonly label?: string;
  readonly icon?: string;
  readonly handler: ActionHandler;
  readonly permissions?: PermissionCheck[];
  readonly validation?: ActionValidationRule[];
  readonly confirm?: ConfirmConfig;
  readonly metadata?: Record<string, unknown>;
}

/**
 * ActionHandler - Handler-Funktion für eine Action
 */
export type ActionHandler<TState = Record<string, unknown>> = (
  context: ActionContext<TState>
) => Promise<Result<void, ActionError>> | Result<void, ActionError>;

/**
 * ActionContext - Kontext für Action-Ausführung
 */
export interface ActionContext<TState = Record<string, unknown>> {
  readonly windowInstanceId: string;
  readonly controlId?: string;
  readonly state: Readonly<TState>;
  readonly event?: Event;
  readonly metadata?: Record<string, unknown>;
}

/**
 * PermissionCheck - Berechtigungs-Prüfung für Actions
 */
export interface PermissionCheck {
  readonly type: "user" | "gm" | "custom";
  readonly check?: (context: ActionContext) => boolean;
}

/**
 * ActionValidationRule - Validierungs-Regel für Actions
 */
export interface ActionValidationRule {
  readonly validate: (context: ActionContext) => boolean;
  readonly message?: string;
}

/**
 * ConfirmConfig - Konfiguration für Bestätigungs-Dialog
 */
export interface ConfirmConfig {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

import type { BindingDescriptor } from "./binding-descriptor.interface";

/**
 * ControlDefinition - Schema für ein Control (UI-Element)
 */
export interface ControlDefinition {
  readonly id: string;
  readonly type: ControlType;
  readonly label?: string;
  readonly placeholder?: string;
  readonly binding?: BindingDescriptor; // Lokales Binding (Shortcut)
  readonly validation?: ValidationRule[];
  readonly actions?: ControlActionMapping; // Mapping: Event → Action-ID
  readonly props?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * ControlType - Unterstützte Control-Typen
 */
export type ControlType =
  | "button"
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "table"
  | "tabs"
  | "custom";

/**
 * ControlActionMapping - Mapping von Events zu Action-IDs
 */
export interface ControlActionMapping {
  readonly primaryAction?: string; // Button: Click
  readonly onChangeAction?: string; // Input: Change
  readonly onFocusAction?: string; // Input: Focus
  readonly onBlurAction?: string; // Input: Blur
}

/**
 * ValidationRule - Validierungs-Regel für Controls
 */
export interface ValidationRule {
  readonly type: "required" | "min" | "max" | "pattern" | "custom";
  readonly value?: unknown;
  readonly message?: string;
  readonly validator?: (value: unknown) => boolean;
}

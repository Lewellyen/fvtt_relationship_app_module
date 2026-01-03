/**
 * Control Props - Typ-Hilfen für Control-Types (Phase 2)
 *
 * Diese Interfaces sind als Dokumentation/Guide gedacht.
 * ControlDefinition.props ist Record<string, unknown>, daher sind diese Types optional.
 */

/**
 * Select Control Props
 */
export interface SelectControlProps {
  readonly options?: Array<{ value: string | number; label: string }>;
  readonly optionsMap?: Record<string | number, string>; // Alternative zu options
  readonly multiple?: boolean;
  readonly disabled?: boolean;
}

/**
 * Checkbox Control Props
 */
export interface CheckboxControlProps {
  readonly checked?: boolean;
  readonly disabled?: boolean;
  readonly label?: string; // Override control.label if needed
}

/**
 * Radio Control Props
 */
export interface RadioControlProps {
  readonly options?: Array<{ value: string | number; label: string }>;
  readonly value?: string | number;
  readonly disabled?: boolean;
}

/**
 * Table Control Props
 */
export interface TableControlProps {
  readonly columns?: Array<{ id: string; label: string; width?: number }>;
  readonly rows?: unknown[][];
  readonly data?: unknown[]; // Alternative: Array of objects (columns define keys)
  readonly sortable?: boolean;
  readonly selectable?: boolean;
  readonly onRowClick?: string; // Action ID
}

/**
 * Tabs Control Props
 */
export interface TabsControlProps {
  readonly tabs?: Array<{ id: string; label: string; content?: ControlDefinition[] }>;
  readonly activeTabId?: string;
  readonly onTabChange?: string; // Action ID
}

/**
 * Re-export ControlDefinition for convenience
 */
import type { ControlDefinition } from "./control-definition.interface";
export type { ControlDefinition };

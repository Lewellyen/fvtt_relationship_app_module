import type { ComponentDescriptor } from "./component-descriptor.interface";
import type { ControlDefinition } from "./control-definition.interface";
import type { ActionDefinition } from "./action-definition.interface";
import type { BindingDescriptor } from "./binding-descriptor.interface";
import type { DependencyDescriptor } from "./dependency-descriptor.interface";
import type { PersistConfig } from "./persist-config.interface";

/**
 * WindowDefinition - Schema/Konfiguration für ein Fenster (statisch, wiederverwendbar)
 */
export interface WindowDefinition {
  readonly definitionId: string; // Statisch, wiederverwendbar
  readonly title?: string;
  readonly icon?: string;
  readonly component: ComponentDescriptor;
  readonly features?: WindowFeatures;
  readonly position?: WindowPosition;
  readonly controls?: ControlDefinition[];
  readonly actions?: ActionDefinition[];
  readonly bindings?: BindingDescriptor[]; // Globale Bindings (Cross-Control)
  readonly dependencies?: DependencyDescriptor[]; // Document-Dependencies für Relevanz-Prüfung
  readonly persist?: PersistConfig;
  readonly classes?: string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * WindowFeatures - Konfiguration für Fenster-Features
 */
export interface WindowFeatures {
  readonly resizable?: boolean;
  readonly minimizable?: boolean;
  readonly draggable?: boolean;
  readonly closable?: boolean;
  readonly pinned?: boolean;
}

/**
 * WindowPosition - Konfiguration für Fenster-Position
 */
export interface WindowPosition {
  readonly width?: number;
  readonly height?: number;
  readonly left?: number;
  readonly top?: number;
  readonly centered?: boolean;
}

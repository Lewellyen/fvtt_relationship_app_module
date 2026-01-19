/**
 * ApplicationV2 - Minimal Interface für Foundry ApplicationV2
 */
import type { DomElement } from "./dom.types";

export interface ApplicationV2 {
  render(options?: {
    force?: boolean;
    position?: {
      top?: number;
      left?: number;
      width?: number | "auto";
      height?: number | "auto";
      scale?: number;
      zIndex?: number;
    };
    window?: {
      title?: string;
      icon?: string | false;
      controls?: boolean;
    };
    parts?: string[];
    isFirstRender?: boolean;
    tab?: string | { name: string; active: boolean } | { [x: string]: string | undefined };
  }): Promise<this>;
  close(options?: { animate?: boolean; closeKey?: boolean; submitted?: boolean }): Promise<this>;
  element?: DomElement;
}

/**
 * ApplicationClass - Type für Foundry ApplicationV2-Klasse
 */
export type ApplicationClass = new (...args: unknown[]) => ApplicationV2;

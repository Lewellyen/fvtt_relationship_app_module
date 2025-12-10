import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortSelectionObserver } from "@/infrastructure/adapters/foundry/versioning/port-selection-observer";

export const portSelectionObserverToken =
  createInjectionToken<PortSelectionObserver>("PortSelectionObserver");

import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { IPortSelectionObservability } from "@/infrastructure/adapters/foundry/versioning/port-selection-observability.interface";

export const portSelectionObservabilityToken = createInjectionToken<IPortSelectionObservability>(
  "PortSelectionObservability"
);

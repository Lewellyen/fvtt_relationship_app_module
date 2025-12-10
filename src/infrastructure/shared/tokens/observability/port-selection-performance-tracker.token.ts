import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { IPortSelectionPerformanceTracker } from "@/infrastructure/adapters/foundry/versioning/port-selection-performance-tracker.interface";

export const portSelectionPerformanceTrackerToken =
  createInjectionToken<IPortSelectionPerformanceTracker>("PortSelectionPerformanceTracker");

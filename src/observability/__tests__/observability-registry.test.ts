import { describe, it, expect, vi } from "vitest";
import { ObservabilityRegistry, type ObservableService } from "../observability-registry";
import type { Logger } from "@/interfaces/logger";
import type { MetricsRecorder } from "@/observability/interfaces/metrics-recorder";
import type { PortSelectionEvent } from "@/foundry/versioning/port-selection-events";

describe("ObservabilityRegistry", () => {
  it("should register port selector and call unsubscribe on dispose", () => {
    const logger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      setMinLevel: vi.fn(),
    };

    const metrics: MetricsRecorder = {
      recordResolution: vi.fn(),
      recordPortSelection: vi.fn(),
      recordPortSelectionFailure: vi.fn(),
      getSnapshot: vi.fn().mockReturnValue({} as never),
      reset: vi.fn(),
    };

    const unsubscribe = vi.fn();
    const observable: ObservableService<PortSelectionEvent> = {
      onEvent: vi.fn().mockReturnValue(unsubscribe),
    };

    const registry = new ObservabilityRegistry(logger, metrics);

    registry.registerPortSelector(observable);
    registry.dispose();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it("should swallow errors from unsubscribe during dispose", () => {
    const logger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      setMinLevel: vi.fn(),
    };

    const metrics: MetricsRecorder = {
      recordResolution: vi.fn(),
      recordPortSelection: vi.fn(),
      recordPortSelectionFailure: vi.fn(),
      getSnapshot: vi.fn().mockReturnValue({} as never),
      reset: vi.fn(),
    };

    const unsubscribe = vi.fn(() => {
      throw new Error("unsubscribe-failed");
    });
    const observable: ObservableService<PortSelectionEvent> = {
      onEvent: vi.fn().mockReturnValue(unsubscribe),
    };

    const registry = new ObservabilityRegistry(logger, metrics);

    registry.registerPortSelector(observable);

    expect(() => registry.dispose()).not.toThrow();
  });
});

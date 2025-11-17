/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
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

  describe("Event emission", () => {
    let logger: Logger;
    let metrics: MetricsRecorder;
    let registry: ObservabilityRegistry;
    let eventCallback: ((event: PortSelectionEvent) => void) | undefined;

    beforeEach(() => {
      logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        setMinLevel: vi.fn(),
      };

      metrics = {
        recordResolution: vi.fn(),
        recordPortSelection: vi.fn(),
        recordPortSelectionFailure: vi.fn(),
        getSnapshot: vi.fn().mockReturnValue({} as never),
        reset: vi.fn(),
      };

      registry = new ObservabilityRegistry(logger, metrics);
    });

    it("should handle success event with adapterName", () => {
      const observable: ObservableService<PortSelectionEvent> = {
        onEvent: vi.fn((callback) => {
          eventCallback = callback;
          return vi.fn();
        }),
      };

      registry.registerPortSelector(observable);

      const successEvent: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 2.5,
        adapterName: "v13",
      };

      eventCallback?.(successEvent);

      expect(logger.debug).toHaveBeenCalledWith("Port v13 selected in 2.50ms for v13");
      expect(metrics.recordPortSelection).toHaveBeenCalledWith(13);
      expect(metrics.recordPortSelectionFailure).not.toHaveBeenCalled();
    });

    it("should handle success event without adapterName", () => {
      const observable: ObservableService<PortSelectionEvent> = {
        onEvent: vi.fn((callback) => {
          eventCallback = callback;
          return vi.fn();
        }),
      };

      registry.registerPortSelector(observable);

      const successEvent: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 1.23,
      };

      eventCallback?.(successEvent);

      expect(logger.debug).toHaveBeenCalledWith("Port v13 selected in 1.23ms");
      expect(metrics.recordPortSelection).toHaveBeenCalledWith(13);
      expect(metrics.recordPortSelectionFailure).not.toHaveBeenCalled();
    });

    it("should handle failure event", () => {
      const observable: ObservableService<PortSelectionEvent> = {
        onEvent: vi.fn((callback) => {
          eventCallback = callback;
          return vi.fn();
        }),
      };

      registry.registerPortSelector(observable);

      const failureEvent: PortSelectionEvent = {
        type: "failure",
        foundryVersion: 14,
        availableVersions: "13",
        adapterName: "v14",
        error: {
          code: "NO_COMPATIBLE_PORT",
          message: "No compatible port found",
        },
      };

      eventCallback?.(failureEvent);

      expect(logger.error).toHaveBeenCalledWith("Port selection failed", {
        foundryVersion: 14,
        availableVersions: "13",
        adapterName: "v14",
      });
      expect(metrics.recordPortSelectionFailure).toHaveBeenCalledWith(14);
      expect(metrics.recordPortSelection).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it("should handle multiple events during active subscription", () => {
      const observable: ObservableService<PortSelectionEvent> = {
        onEvent: vi.fn((callback) => {
          eventCallback = callback;
          return vi.fn();
        }),
      };

      registry.registerPortSelector(observable);

      const successEvent1: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 1.0,
      };

      const successEvent2: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 2.0,
        adapterName: "v13",
      };

      eventCallback?.(successEvent1);
      eventCallback?.(successEvent2);

      expect(logger.debug).toHaveBeenCalledTimes(2);
      expect(metrics.recordPortSelection).toHaveBeenCalledTimes(2);
      expect(metrics.recordPortSelection).toHaveBeenNthCalledWith(1, 13);
      expect(metrics.recordPortSelection).toHaveBeenNthCalledWith(2, 13);
    });
  });
});

/**
 * Tests for PortSelectionObservability
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PortSelectionObservability } from "@/infrastructure/adapters/foundry/versioning/port-selection-observability";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import type { PortSelectionObserver } from "@/infrastructure/adapters/foundry/versioning/port-selection-observer";
import type { PortSelectionEvent } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";

describe("PortSelectionObservability", () => {
  let observability: PortSelectionObservability;
  let mockRegistry: ObservabilityRegistry;
  let mockSelector: PortSelector;
  let mockObserver: PortSelectionObserver;

  beforeEach(() => {
    mockRegistry = {
      registerPortSelector: vi.fn(),
    } as any;

    mockSelector = {
      onEvent: vi.fn((_callback: (event: PortSelectionEvent) => void) => {
        // Return unsubscribe function
        return () => {};
      }),
    } as any;

    mockObserver = {
      handleEvent: vi.fn(),
    } as any;

    observability = new PortSelectionObservability(mockRegistry);
  });

  describe("registerWithObservabilityRegistry", () => {
    it("should register PortSelector with ObservabilityRegistry", () => {
      observability.registerWithObservabilityRegistry(mockSelector);

      expect(mockRegistry.registerPortSelector).toHaveBeenCalledWith(mockSelector);
      expect(mockRegistry.registerPortSelector).toHaveBeenCalledTimes(1);
    });
  });

  describe("setupObservability", () => {
    it("should setup observability wiring between selector and observer", () => {
      const testEvent: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 5.5,
      };

      let eventCallback: ((event: PortSelectionEvent) => void) | undefined;
      (mockSelector.onEvent as any).mockImplementation(
        (callback: (event: PortSelectionEvent) => void) => {
          eventCallback = callback;
          return () => {};
        }
      );

      observability.setupObservability(mockSelector, mockObserver);

      expect(mockSelector.onEvent).toHaveBeenCalledTimes(1);
      expect(mockObserver.handleEvent).not.toHaveBeenCalled();

      // Simulate event emission
      if (eventCallback) {
        eventCallback(testEvent);
      }

      expect(mockObserver.handleEvent).toHaveBeenCalledWith(testEvent);
      expect(mockObserver.handleEvent).toHaveBeenCalledTimes(1);
    });

    it("should forward multiple events to observer", () => {
      const event1: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 5.5,
      };
      const event2: PortSelectionEvent = {
        type: "failure",
        foundryVersion: 13,
        availableVersions: "14, 15",
        error: { code: "PORT_SELECTION_FAILED" as const, message: "No compatible port" } as any,
      };

      let eventCallback: ((event: PortSelectionEvent) => void) | undefined;
      (mockSelector.onEvent as any).mockImplementation(
        (callback: (event: PortSelectionEvent) => void) => {
          eventCallback = callback;
          return () => {};
        }
      );

      observability.setupObservability(mockSelector, mockObserver);

      if (eventCallback) {
        eventCallback(event1);
        eventCallback(event2);
      }

      expect(mockObserver.handleEvent).toHaveBeenCalledTimes(2);
      expect(mockObserver.handleEvent).toHaveBeenNthCalledWith(1, event1);
      expect(mockObserver.handleEvent).toHaveBeenNthCalledWith(2, event2);
    });
  });
});

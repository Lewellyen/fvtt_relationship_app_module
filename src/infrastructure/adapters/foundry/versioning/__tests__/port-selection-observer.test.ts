/**
 * Tests for PortSelectionObserver
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PortSelectionObserver } from "@/infrastructure/adapters/foundry/versioning/port-selection-observer";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { MetricsRecorder } from "@/infrastructure/observability/interfaces/metrics-recorder";
import type { PortSelectionEvent } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";

describe("PortSelectionObserver", () => {
  let mockLogger: Logger;
  let mockMetrics: MetricsRecorder;
  let mockEventEmitter: PortSelectionEventEmitter;
  let observer: PortSelectionObserver;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
    } as unknown as Logger;

    mockMetrics = {
      recordPortSelection: vi.fn(),
      recordPortSelectionFailure: vi.fn(),
      recordResolution: vi.fn(),
      recordCacheAccess: vi.fn(),
    };

    mockEventEmitter = {
      emit: vi.fn(),
      subscribe: vi.fn(),
      clear: vi.fn(),
      getSubscriberCount: vi.fn(),
    } as unknown as PortSelectionEventEmitter;

    observer = new PortSelectionObserver(mockLogger, mockMetrics, mockEventEmitter);
  });

  describe("handleEvent", () => {
    it("should handle success events", () => {
      const event: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 5.5,
      };

      observer.handleEvent(event);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Port selection completed in 5.50ms")
      );
      expect(mockMetrics.recordPortSelection).toHaveBeenCalledWith(13);
    });

    it("should include adapter name in success log", () => {
      const event: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        adapterName: "FoundryHooks",
        durationMs: 3.2,
      };

      observer.handleEvent(event);

      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining("for FoundryHooks"));
    });

    it("should handle failure events", () => {
      const event: PortSelectionEvent = {
        type: "failure",
        foundryVersion: 13,
        availableVersions: "14, 15",

        error: { code: "PORT_SELECTION_FAILED" as const, message: "No compatible port" } as any,
      };

      observer.handleEvent(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "No compatible port found",
        expect.objectContaining({
          foundryVersion: 13,
          availableVersions: "14, 15",
        })
      );
      expect(mockMetrics.recordPortSelectionFailure).toHaveBeenCalledWith(13);
    });

    it("should include adapter name in failure log", () => {
      const event: PortSelectionEvent = {
        type: "failure",
        foundryVersion: 13,
        availableVersions: "15",
        adapterName: "FoundryGame",

        error: { code: "PORT_SELECTION_FAILED" as const, message: "No compatible port" } as any,
      };

      observer.handleEvent(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "No compatible port found",
        expect.objectContaining({
          adapterName: "FoundryGame",
        })
      );
    });
  });
});

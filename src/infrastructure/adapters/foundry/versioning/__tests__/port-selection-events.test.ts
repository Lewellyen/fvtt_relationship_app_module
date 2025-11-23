/**
 * Tests for PortSelectionEventEmitter
 */

import { describe, it, expect, vi } from "vitest";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { PortSelectionEvent } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";

describe("PortSelectionEventEmitter", () => {
  describe("subscribe", () => {
    it("should allow subscribing to events", () => {
      const emitter = new PortSelectionEventEmitter();
      const callback = vi.fn();

      const unsubscribe = emitter.subscribe(callback);

      expect(typeof unsubscribe).toBe("function");
      expect(emitter.getSubscriberCount()).toBe(1);
    });

    it("should support multiple subscribers", () => {
      const emitter = new PortSelectionEventEmitter();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.subscribe(callback1);
      emitter.subscribe(callback2);

      expect(emitter.getSubscriberCount()).toBe(2);
    });
  });

  describe("emit", () => {
    it("should emit success events to all subscribers", () => {
      const emitter = new PortSelectionEventEmitter();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.subscribe(callback1);
      emitter.subscribe(callback2);

      const event: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 5,
      };

      emitter.emit(event);

      expect(callback1).toHaveBeenCalledWith(event);
      expect(callback2).toHaveBeenCalledWith(event);
    });

    it("should emit failure events to all subscribers", () => {
      const emitter = new PortSelectionEventEmitter();
      const callback = vi.fn();

      emitter.subscribe(callback);

      const event: PortSelectionEvent = {
        type: "failure",
        foundryVersion: 13,
        availableVersions: "15",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: { code: "PORT_SELECTION_FAILED" as const, message: "No compatible port" } as any,
      };

      emitter.emit(event);

      expect(callback).toHaveBeenCalledWith(event);
    });

    it("should handle subscriber errors gracefully", () => {
      const emitter = new PortSelectionEventEmitter();
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Subscriber error");
      });
      const successCallback = vi.fn();

      emitter.subscribe(errorCallback);
      emitter.subscribe(successCallback);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const event: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 5,
      };

      // Should not throw, both callbacks called
      emitter.emit(event);

      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe callback", () => {
      const emitter = new PortSelectionEventEmitter();
      const callback = vi.fn();

      const unsubscribe = emitter.subscribe(callback);
      expect(emitter.getSubscriberCount()).toBe(1);

      unsubscribe();
      expect(emitter.getSubscriberCount()).toBe(0);

      const event: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 5,
      };

      emitter.emit(event);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle multiple unsubscribe calls safely", () => {
      const emitter = new PortSelectionEventEmitter();
      const callback = vi.fn();

      const unsubscribe = emitter.subscribe(callback);
      unsubscribe();
      unsubscribe(); // Second call should be safe

      expect(emitter.getSubscriberCount()).toBe(0);
    });
  });

  describe("clear", () => {
    it("should remove all subscribers", () => {
      const emitter = new PortSelectionEventEmitter();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.subscribe(callback1);
      emitter.subscribe(callback2);
      expect(emitter.getSubscriberCount()).toBe(2);

      emitter.clear();
      expect(emitter.getSubscriberCount()).toBe(0);

      const event: PortSelectionEvent = {
        type: "success",
        selectedVersion: 13,
        foundryVersion: 13,
        durationMs: 5,
      };

      emitter.emit(event);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe("getSubscriberCount", () => {
    it("should return current subscriber count", () => {
      const emitter = new PortSelectionEventEmitter();

      expect(emitter.getSubscriberCount()).toBe(0);

      const unsub1 = emitter.subscribe(vi.fn());
      expect(emitter.getSubscriberCount()).toBe(1);

      const unsub2 = emitter.subscribe(vi.fn());
      expect(emitter.getSubscriberCount()).toBe(2);

      unsub1();
      expect(emitter.getSubscriberCount()).toBe(1);

      unsub2();
      expect(emitter.getSubscriberCount()).toBe(0);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MetricsStateManager } from "../metrics-state-manager";

describe("MetricsStateManager", () => {
  let manager: MetricsStateManager;

  beforeEach(() => {
    manager = new MetricsStateManager();
  });

  describe("onStateChanged", () => {
    it("should register callback", () => {
      const callback = vi.fn();
      manager.onStateChanged(callback);

      // Access private method via type assertion for testing
      (manager as unknown as { notifyStateChanged(): void }).notifyStateChanged();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should register multiple callbacks", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      manager.onStateChanged(callback1);
      manager.onStateChanged(callback2);
      manager.onStateChanged(callback3);

      (manager as unknown as { notifyStateChanged(): void }).notifyStateChanged();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it("should call all callbacks on notify", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.onStateChanged(callback1);
      manager.onStateChanged(callback2);

      (manager as unknown as { notifyStateChanged(): void }).notifyStateChanged();
      (manager as unknown as { notifyStateChanged(): void }).notifyStateChanged();

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(2);
    });
  });

  describe("unsubscribe", () => {
    it("should remove callback", () => {
      const callback = vi.fn();
      manager.onStateChanged(callback);
      manager.unsubscribe(callback);

      (manager as unknown as { notifyStateChanged(): void }).notifyStateChanged();

      expect(callback).not.toHaveBeenCalled();
    });

    it("should only remove specified callback", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.onStateChanged(callback1);
      manager.onStateChanged(callback2);
      manager.unsubscribe(callback1);

      (manager as unknown as { notifyStateChanged(): void }).notifyStateChanged();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should handle removing non-existent callback", () => {
      const callback = vi.fn();
      expect(() => manager.unsubscribe(callback)).not.toThrow();
    });
  });

  describe("reset", () => {
    it("should clear all callbacks", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.onStateChanged(callback1);
      manager.onStateChanged(callback2);
      manager.reset();

      (manager as unknown as { notifyStateChanged(): void }).notifyStateChanged();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should continue calling other callbacks if one throws", () => {
      const callback1 = vi.fn(() => {
        throw new Error("Test error");
      });
      const callback2 = vi.fn();

      manager.onStateChanged(callback1);
      manager.onStateChanged(callback2);

      // Should not throw, but callback2 should still be called
      expect(() => {
        (manager as unknown as { notifyStateChanged(): void }).notifyStateChanged();
      }).not.toThrow();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});

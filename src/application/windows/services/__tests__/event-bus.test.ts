import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventBus } from "../event-bus";

describe("EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe("emit", () => {
    it("should emit event to all listeners", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on("window:created", handler1);
      eventBus.on("window:created", handler2);

      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });

      expect(handler1).toHaveBeenCalledWith({
        instanceId: "instance-1",
        definitionId: "definition-1",
      });
      expect(handler2).toHaveBeenCalledWith({
        instanceId: "instance-1",
        definitionId: "definition-1",
      });
    });

    it("should not emit if no listeners registered", () => {
      const handler = vi.fn();

      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should emit different event types correctly", () => {
      const windowHandler = vi.fn();
      const stateHandler = vi.fn();

      eventBus.on("window:created", windowHandler);
      eventBus.on("state:updated", stateHandler);

      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });
      eventBus.emit("state:updated", {
        instanceId: "instance-1",
        key: "count",
        value: 1,
      });

      expect(windowHandler).toHaveBeenCalledWith({
        instanceId: "instance-1",
        definitionId: "definition-1",
      });
      expect(stateHandler).toHaveBeenCalledWith({
        instanceId: "instance-1",
        key: "count",
        value: 1,
      });
      expect(windowHandler).toHaveBeenCalledTimes(1);
      expect(stateHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("on", () => {
    it("should register listener and return unsubscribe function", () => {
      const handler = vi.fn();
      const payload = { instanceId: "instance-1", definitionId: "definition-1" };

      const unsubscribe = eventBus.on("window:created", handler);

      eventBus.emit("window:created", payload);
      expect(handler).toHaveBeenCalledWith(payload);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      eventBus.emit("window:created", payload);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it("should register multiple listeners for same event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBus.on("window:created", handler1);
      eventBus.on("window:created", handler2);
      eventBus.on("window:created", handler3);

      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it("should clean up event map when last listener is removed", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on("window:created", handler);

      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.has("window:created")).toBe(true);

      unsubscribe();

      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.has("window:created")).toBe(false);
    });

    it("should clean up event map when eventListeners.size becomes 0", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const unsubscribe1 = eventBus.on("window:created", handler1);
      const unsubscribe2 = eventBus.on("window:created", handler2);

      // @ts-expect-error - accessing private member for test
      const eventListeners = eventBus.listeners.get("window:created");
      expect(eventListeners?.size).toBe(2);

      // Remove first listener - size should be 1, map should still exist
      unsubscribe1();
      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.has("window:created")).toBe(true);
      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.get("window:created")?.size).toBe(1);

      // Remove second listener - size should be 0, map should be cleaned up
      unsubscribe2();
      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.has("window:created")).toBe(false);
    });
  });

  describe("off", () => {
    it("should remove listener", () => {
      const handler = vi.fn();

      eventBus.on("window:created", handler);
      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });
      expect(handler).toHaveBeenCalledTimes(1);

      eventBus.off("window:created", handler);
      eventBus.emit("window:created", {
        instanceId: "instance-2",
        definitionId: "definition-2",
      });
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it("should not throw if removing non-existent listener", () => {
      const handler = vi.fn();

      expect(() => {
        eventBus.off("window:created", handler);
      }).not.toThrow();
    });

    it("should not throw if removing from non-existent event", () => {
      const handler = vi.fn();

      expect(() => {
        eventBus.off("window:created", handler);
      }).not.toThrow();
    });

    it("should clean up event map when last listener is removed via off", () => {
      const handler = vi.fn();

      eventBus.on("window:created", handler);

      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.has("window:created")).toBe(true);

      eventBus.off("window:created", handler);

      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.has("window:created")).toBe(false);
    });

    it("should remove specific listener while keeping others", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBus.on("window:created", handler1);
      eventBus.on("window:created", handler2);
      eventBus.on("window:created", handler3);

      eventBus.off("window:created", handler2);

      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalledTimes(1);
    });
  });

  describe("once", () => {
    it("should call handler only once", () => {
      const handler = vi.fn();

      eventBus.once("window:created", handler);

      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });
      eventBus.emit("window:created", {
        instanceId: "instance-2",
        definitionId: "definition-2",
      });
      eventBus.emit("window:created", {
        instanceId: "instance-3",
        definitionId: "definition-3",
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        instanceId: "instance-1",
        definitionId: "definition-1",
      });
    });

    it("should automatically remove listener after first call", () => {
      const handler = vi.fn();

      eventBus.once("window:created", handler);

      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.has("window:created")).toBe(true);

      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });

      // @ts-expect-error - accessing private member for test
      expect(eventBus.listeners.has("window:created")).toBe(false);
    });

    it("should work with multiple once listeners", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.once("window:created", handler1);
      eventBus.once("window:created", handler2);

      eventBus.emit("window:created", {
        instanceId: "instance-1",
        definitionId: "definition-1",
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      // Both should be removed now
      eventBus.emit("window:created", {
        instanceId: "instance-2",
        definitionId: "definition-2",
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });
});

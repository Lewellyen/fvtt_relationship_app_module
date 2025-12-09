import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FoundryUIAvailabilityPort } from "../FoundryUIAvailabilityPort";
import { cleanupFoundryGlobals, setupFoundryGlobals } from "@/test/utils/test-helpers";

describe("FoundryUIAvailabilityPort", () => {
  let port: FoundryUIAvailabilityPort;

  beforeEach(() => {
    port = new FoundryUIAvailabilityPort();
    cleanupFoundryGlobals();
  });

  afterEach(() => {
    cleanupFoundryGlobals();
  });

  describe("isAvailable", () => {
    it("should return false when ui is undefined", () => {
      // ui is not set
      expect(port.isAvailable()).toBe(false);
    });

    it("should return false when ui.notifications is undefined", () => {
      setupFoundryGlobals({
        ui: {
          notifications: undefined,
        } as any,
      });

      expect(port.isAvailable()).toBe(false);
    });

    it("should return true when ui.notifications is available", () => {
      setupFoundryGlobals({
        ui: {
          notifications: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
          },
        } as any,
      });

      expect(port.isAvailable()).toBe(true);
    });

    it("should return true when ui.notifications exists with methods", () => {
      const mockNotifications = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      setupFoundryGlobals({
        ui: {
          notifications: mockNotifications,
        } as any,
      });

      expect(port.isAvailable()).toBe(true);
    });
  });

  describe("onAvailable", () => {
    it("should be defined but not implemented", () => {
      expect(port.onAvailable).toBeDefined();
      expect(typeof port.onAvailable).toBe("function");

      // Should not throw when called
      const callback = vi.fn();
      expect(() => port.onAvailable?.(callback)).not.toThrow();
    });
  });
});

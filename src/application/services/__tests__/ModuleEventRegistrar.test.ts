import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModuleEventRegistrar } from "../ModuleEventRegistrar";
import type { EventRegistrar } from "@/application/use-cases/event-registrar.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { ok, err } from "@/domain/utils/result";

describe("ModuleEventRegistrar", () => {
  let mockEventRegistrar1: EventRegistrar;
  let mockEventRegistrar2: EventRegistrar;
  let mockEventRegistrar3: EventRegistrar;
  let mockNotificationCenter: NotificationPublisherPort;
  let registrar: ModuleEventRegistrar;

  beforeEach(() => {
    mockEventRegistrar1 = {
      register: vi.fn().mockReturnValue(ok(undefined)),
      dispose: vi.fn(),
    };

    mockEventRegistrar2 = {
      register: vi.fn().mockReturnValue(ok(undefined)),
      dispose: vi.fn(),
    };

    mockEventRegistrar3 = {
      register: vi.fn().mockReturnValue(ok(undefined)),
      dispose: vi.fn(),
    };

    mockNotificationCenter = {
      debug: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      info: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      warn: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      error: vi.fn().mockReturnValue({ ok: true, value: undefined }),
    } as unknown as NotificationPublisherPort;

    registrar = new ModuleEventRegistrar(
      mockEventRegistrar1,
      mockEventRegistrar2,
      mockEventRegistrar3,
      mockNotificationCenter
    );
  });

  describe("registerAll", () => {
    it("should register all event listeners successfully", () => {
      const result = registrar.registerAll();

      expect(result.ok).toBe(true);
      expect(mockEventRegistrar1.register).toHaveBeenCalled();
      expect(mockEventRegistrar2.register).toHaveBeenCalled();
      expect(mockEventRegistrar3.register).toHaveBeenCalled();
    });

    it("should handle registration errors", () => {
      const testError = new Error("Registration failed");
      mockEventRegistrar1.register = vi.fn().mockReturnValue(err(testError));

      const result = registrar.registerAll();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toHaveLength(1);
        expect(result.error[0]).toBe(testError);
      }

      expect(mockNotificationCenter.error).toHaveBeenCalledWith(
        "Failed to register event listener",
        expect.objectContaining({
          code: "EVENT_REGISTRATION_FAILED",
          message: "Registration failed",
        }),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should continue registering other listeners after one fails", () => {
      mockEventRegistrar1.register = vi.fn().mockReturnValue(err(new Error("First failed")));

      const result = registrar.registerAll();

      expect(result.ok).toBe(false);
      // Second registrar should still be called
      expect(mockEventRegistrar2.register).toHaveBeenCalled();
    });

    it("should collect all errors from multiple failed registrations", () => {
      const error1 = new Error("First failed");
      const error2 = new Error("Second failed");
      mockEventRegistrar1.register = vi.fn().mockReturnValue(err(error1));
      mockEventRegistrar2.register = vi.fn().mockReturnValue(err(error2));

      const result = registrar.registerAll();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toHaveLength(2);
        expect(result.error[0]).toBe(error1);
        expect(result.error[1]).toBe(error2);
      }
    });
  });

  describe("disposeAll", () => {
    it("should dispose all event registrars", () => {
      registrar.disposeAll();

      expect(mockEventRegistrar1.dispose).toHaveBeenCalled();
      expect(mockEventRegistrar2.dispose).toHaveBeenCalled();
      expect(mockEventRegistrar3.dispose).toHaveBeenCalled();
    });
  });
});

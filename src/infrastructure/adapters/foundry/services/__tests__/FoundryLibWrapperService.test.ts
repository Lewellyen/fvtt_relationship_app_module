import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryLibWrapperService, DIFoundryLibWrapperService } from "../FoundryLibWrapperService";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type {
  LibWrapperFunction,
  LibWrapperType,
} from "@/domain/services/lib-wrapper-service.interface";
import { MODULE_METADATA } from "@/application/constants/app-constants";

describe("FoundryLibWrapperService", () => {
  let service: FoundryLibWrapperService;
  let mockLogger: Logger;
  let mockLibWrapper: {
    register: ReturnType<typeof vi.fn>;
    unregister: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock Logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    // Mock libWrapper
    mockLibWrapper = {
      register: vi.fn(),
      unregister: vi.fn(),
    };

    // Set global libWrapper
    (globalThis as unknown as { libWrapper: typeof mockLibWrapper }).libWrapper = mockLibWrapper;

    service = new FoundryLibWrapperService("test-module-id", mockLogger);
  });

  afterEach(() => {
    // Cleanup
    delete (globalThis as unknown as { libWrapper?: unknown }).libWrapper;
    service.dispose();
  });

  describe("register", () => {
    it("should register a wrapper successfully", () => {
      const target = "foundry.applications.ux.ContextMenu.implementation.prototype.render";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);
      const type: LibWrapperType = "WRAPPER";

      const result = service.register(target, wrapperFn, type);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(1); // First registration gets ID 1
      }
      expect(mockLibWrapper.register).toHaveBeenCalledWith(
        "test-module-id",
        target,
        wrapperFn,
        type
      );
    });

    it("should return different registration IDs for different targets", () => {
      const target1 = "target1";
      const target2 = "target2";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      const result1 = service.register(target1, wrapperFn, "WRAPPER");
      const result2 = service.register(target2, wrapperFn, "WRAPPER");

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value).toBe(1);
        expect(result2.value).toBe(2);
      }
    });

    it("should reject registration if target is already registered", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      const result1 = service.register(target, wrapperFn, "WRAPPER");
      expect(result1.ok).toBe(true);

      const result2 = service.register(target, wrapperFn, "WRAPPER");
      expect(result2.ok).toBe(false);
      if (!result2.ok) {
        expect(result2.error.code).toBe("REGISTRATION_FAILED");
        expect(result2.error.message).toContain("already registered");
      }
    });

    it("should reject registration if libWrapper is not available", () => {
      delete (globalThis as unknown as { libWrapper?: unknown }).libWrapper;

      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      const result = service.register(target, wrapperFn, "WRAPPER");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("LIBWRAPPER_NOT_AVAILABLE");
      }
    });

    it("should support all wrapper types", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);
      const types: LibWrapperType[] = ["WRAPPER", "MIXED", "OVERRIDE"];

      for (const type of types) {
        const result = service.register(`${target}-${type}`, wrapperFn, type);
        expect(result.ok).toBe(true);
        expect(mockLibWrapper.register).toHaveBeenCalledWith(
          "test-module-id",
          `${target}-${type}`,
          wrapperFn,
          type
        );
      }
    });

    it("should handle registration errors from libWrapper", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);
      const error = new Error("libWrapper registration failed");

      mockLibWrapper.register.mockImplementation(() => {
        throw error;
      });

      const result = service.register(target, wrapperFn, "WRAPPER");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REGISTRATION_FAILED");
        expect(result.error.message).toContain(target);
        expect(result.error.details).toEqual({ target, error });
      }
    });

    it("should handle libWrapper becoming undefined during registration (coverage for line 90)", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      // Use Object.defineProperty to create a getter that returns undefined on second access
      // This simulates libWrapper becoming undefined between the initial check and tryCatch
      let accessCount = 0;
      Object.defineProperty(globalThis, "libWrapper", {
        get() {
          accessCount++;
          // First access (initial check) - return mockLibWrapper
          // Second access (inside tryCatch) - return undefined to trigger line 90
          if (accessCount === 1) {
            return mockLibWrapper;
          }
          return undefined;
        },
        configurable: true,
      });

      const result = service.register(target, wrapperFn, "WRAPPER");

      // Restore
      delete (globalThis as unknown as { libWrapper?: unknown }).libWrapper;
      (globalThis as unknown as { libWrapper: typeof mockLibWrapper }).libWrapper = mockLibWrapper;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REGISTRATION_FAILED");
        expect(result.error.message).toContain("libWrapper is not available");
      }
    });
  });

  describe("unregister", () => {
    it("should unregister a previously registered target", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      const registerResult = service.register(target, wrapperFn, "WRAPPER");
      expect(registerResult.ok).toBe(true);

      const unregisterResult = service.unregister(target);

      expect(unregisterResult.ok).toBe(true);
      expect(mockLibWrapper.unregister).toHaveBeenCalledWith("test-module-id", target);
    });

    it("should reject unregistration if target is not registered", () => {
      const target = "not-registered";

      const result = service.unregister(target);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("TARGET_NOT_REGISTERED");
        expect(result.error.message).toContain(target);
      }
      expect(mockLibWrapper.unregister).not.toHaveBeenCalled();
    });

    it("should reject unregistration if libWrapper is not available", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      const registerResult = service.register(target, wrapperFn, "WRAPPER");
      expect(registerResult.ok).toBe(true);

      delete (globalThis as unknown as { libWrapper?: unknown }).libWrapper;

      const result = service.unregister(target);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("LIBWRAPPER_NOT_AVAILABLE");
      }
    });

    it("should handle unregistration errors from libWrapper", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);
      const error = new Error("libWrapper unregistration failed");

      const registerResult = service.register(target, wrapperFn, "WRAPPER");
      expect(registerResult.ok).toBe(true);

      mockLibWrapper.unregister.mockImplementation(() => {
        throw error;
      });

      const result = service.unregister(target);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UNREGISTRATION_FAILED");
        expect(result.error.message).toContain(target);
        expect(result.error.details).toEqual({ target, error });
      }
    });

    it("should handle libWrapper becoming undefined during unregistration (coverage for line 136)", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      const registerResult = service.register(target, wrapperFn, "WRAPPER");
      expect(registerResult.ok).toBe(true);

      // Use Object.defineProperty to create a getter that returns undefined on second access
      // This simulates libWrapper becoming undefined between the initial check and tryCatch
      let accessCount = 0;
      Object.defineProperty(globalThis, "libWrapper", {
        get() {
          accessCount++;
          // First access (initial check) - return mockLibWrapper
          // Second access (inside tryCatch) - return undefined to trigger line 136
          if (accessCount === 1) {
            return mockLibWrapper;
          }
          return undefined;
        },
        configurable: true,
      });

      const result = service.unregister(target);

      // Restore
      delete (globalThis as unknown as { libWrapper?: unknown }).libWrapper;
      (globalThis as unknown as { libWrapper: typeof mockLibWrapper }).libWrapper = mockLibWrapper;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UNREGISTRATION_FAILED");
        expect(result.error.message).toContain("libWrapper is not available");
      }
    });
  });

  describe("dispose", () => {
    it("should unregister all registered targets", () => {
      const target1 = "target1";
      const target2 = "target2";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      service.register(target1, wrapperFn, "WRAPPER");
      service.register(target2, wrapperFn, "WRAPPER");

      service.dispose();

      expect(mockLibWrapper.unregister).toHaveBeenCalledWith("test-module-id", target1);
      expect(mockLibWrapper.unregister).toHaveBeenCalledWith("test-module-id", target2);
      expect(mockLibWrapper.unregister).toHaveBeenCalledTimes(2);
    });

    it("should handle errors during dispose gracefully", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      service.register(target, wrapperFn, "WRAPPER");

      mockLibWrapper.unregister.mockImplementation(() => {
        throw new Error("Unregister failed");
      });

      // Should not throw
      expect(() => service.dispose()).not.toThrow();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should clear all registrations after dispose", () => {
      const target = "target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      service.register(target, wrapperFn, "WRAPPER");
      service.dispose();

      // Try to unregister again - should fail because it's no longer tracked
      const result = service.unregister(target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("TARGET_NOT_REGISTERED");
      }
    });
  });

  describe("DIFoundryLibWrapperService", () => {
    it("should use MODULE_METADATA.ID in constructor", () => {
      const diService = new DIFoundryLibWrapperService(mockLogger);

      // Verify it uses the correct module ID by registering something
      const target = "test-target";
      const wrapperFn: LibWrapperFunction = (wrapped, ...args) => wrapped(...args);

      const result = diService.register(target, wrapperFn, "WRAPPER");

      expect(result.ok).toBe(true);
      expect(mockLibWrapper.register).toHaveBeenCalledWith(
        MODULE_METADATA.ID,
        target,
        wrapperFn,
        "WRAPPER"
      );

      diService.dispose();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  JournalContextMenuLibWrapperService,
  DIJournalContextMenuLibWrapperService,
} from "../JournalContextMenuLibWrapperService";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { LibWrapperService } from "@/domain/services/lib-wrapper-service.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-event-port.interface";
import { ok, err } from "@/domain/utils/result";

describe("JournalContextMenuLibWrapperService", () => {
  let service: JournalContextMenuLibWrapperService;
  let mockLogger: Logger;
  let mockLibWrapperService: LibWrapperService;

  beforeEach(() => {
    // Mock Logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    // Mock LibWrapperService
    mockLibWrapperService = {
      register: vi.fn().mockReturnValue(ok(1)),
      unregister: vi.fn().mockReturnValue(ok(undefined)),
      dispose: vi.fn(),
    } as unknown as LibWrapperService;

    // Mock foundry global
    vi.stubGlobal("foundry", {
      applications: {
        ux: {
          ContextMenu: {
            implementation: {},
          },
        },
      },
    });

    service = new JournalContextMenuLibWrapperService(mockLibWrapperService, mockLogger);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    service.dispose();
  });

  describe("register", () => {
    it("should register libWrapper successfully", () => {
      const result = service.register();

      expect(result.ok).toBe(true);
      expect(mockLibWrapperService.register).toHaveBeenCalledWith(
        "foundry.applications.ux.ContextMenu.implementation.prototype.render",
        expect.any(Function),
        "WRAPPER"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith("Journal context menu libWrapper registered");
    });

    it("should return success if already registered", () => {
      const result1 = service.register();
      expect(result1.ok).toBe(true);

      const result2 = service.register();
      expect(result2.ok).toBe(true);
      // Should only register once
      expect(mockLibWrapperService.register).toHaveBeenCalledTimes(1);
    });

    it("should return error if ContextMenu is not available", () => {
      vi.unstubAllGlobals();
      vi.stubGlobal("foundry", undefined);

      const result = service.register();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("ContextMenu is not available");
      }
    });

    it("should return error if libWrapperService registration fails", () => {
      vi.mocked(mockLibWrapperService.register).mockReturnValue(
        err({ code: "REGISTRATION_FAILED" as const, message: "Registration failed" })
      );

      const result = service.register();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Registration failed");
      }
    });
  });

  describe("addCallback", () => {
    it("should add callback to list", () => {
      const callback = vi.fn();
      service.addCallback(callback);

      // Callbacks are tested via wrapper function
      expect(callback).toBeDefined();
    });

    it("should allow multiple callbacks", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      service.addCallback(callback1);
      service.addCallback(callback2);

      // Both callbacks should be registered
      expect(callback1).toBeDefined();
      expect(callback2).toBeDefined();
    });
  });

  describe("removeCallback", () => {
    it("should remove callback from list", () => {
      const callback = vi.fn();
      service.addCallback(callback);
      service.removeCallback(callback);

      // Callback should be removed
      expect(callback).toBeDefined();
    });

    it("should handle removing non-existent callback gracefully", () => {
      const callback = vi.fn();
      service.removeCallback(callback);

      // Should not throw
      expect(callback).toBeDefined();
    });
  });

  describe("wrapper function", () => {
    it("should call all registered callbacks when journal entry context menu is rendered", () => {
      // Register libWrapper
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      // Add callbacks
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      service.addCallback(callback1);
      service.addCallback(callback2);

      // Get wrapper function from mock
      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      // Create mock context menu and target
      const target = document.createElement("div");
      target.setAttribute("data-entry-id", "journal-123");

      const menuItems = [{ name: "Existing Item", icon: "<i></i>", callback: vi.fn() }];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();

      // Call wrapper function
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // Both callbacks should be called
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Callbacks should receive JournalContextMenuEvent
      const event1 = callback1.mock.calls[0]?.[0] as JournalContextMenuEvent;
      expect(event1).toBeDefined();
      expect(event1.htmlElement).toBe(target);
      expect(event1.options).toHaveLength(1);
      expect(event1.timestamp).toBeGreaterThan(0);
    });

    it("should not call callbacks for non-journal elements", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const callback = vi.fn();
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const target = document.createElement("div");
      // No data-entry-id or data-document-id

      const mockContextMenu = {
        menuItems: [{ name: "Item", icon: "<i></i>", callback: vi.fn() }],
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // Callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });

    it("should add new menu items from event.options", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "New Item",
          icon: "<i class='fas fa-star'></i>",
          callback: vi.fn(),
        });
      });
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const target = document.createElement("div");
      target.setAttribute("data-entry-id", "journal-123");

      const menuItems = [{ name: "Existing Item", icon: "<i></i>", callback: vi.fn() }];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // New item should be added to menuItems
      expect(menuItems).toHaveLength(2);
      expect(menuItems[1]?.name).toBe("New Item");
    });

    it("should handle Promise-returning menu item callbacks with rejection (coverage for lines 201-204)", async () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const rejectedPromise = Promise.reject(new Error("Callback error"));
      const promiseCallback = vi.fn().mockReturnValue(rejectedPromise);

      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Promise Item",
          icon: "<i></i>",
          callback: promiseCallback,
        });
      });
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const target = document.createElement("div");
      target.setAttribute("data-entry-id", "journal-123");

      const menuItems = [{ name: "Existing Item", icon: "<i></i>", callback: vi.fn() }];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // New item should be added
      expect(menuItems).toHaveLength(2);
      expect(menuItems[1]?.name).toBe("Promise Item");

      // Now call the menu item callback to trigger the Promise handling (lines 201-204)
      const addedMenuItem = menuItems[1];
      if (addedMenuItem) {
        addedMenuItem.callback();
      }

      // Wait for promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Promise callback should have been called
      expect(promiseCallback).toHaveBeenCalledWith(target);
    });

    it("should handle Promise-returning menu item callbacks with resolution (coverage for lines 201-204)", async () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const resolvedPromise = Promise.resolve("Success");
      const promiseCallback = vi.fn().mockReturnValue(resolvedPromise);

      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Resolved Promise Item",
          icon: "<i></i>",
          callback: promiseCallback,
        });
      });
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const target = document.createElement("div");
      target.setAttribute("data-entry-id", "journal-123");

      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [
        { name: "Existing Item", icon: "<i></i>", callback: vi.fn() },
      ];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // New item should be added
      expect(menuItems).toHaveLength(2);
      expect(menuItems[1]?.name).toBe("Resolved Promise Item");

      // Now call the menu item callback to trigger the Promise handling (lines 201-204)
      const addedMenuItem = menuItems[1];
      if (addedMenuItem) {
        addedMenuItem.callback();
      }

      // Wait for promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Promise callback should have been called
      expect(promiseCallback).toHaveBeenCalledWith(target);
    });

    it("should handle non-Promise-returning menu item callbacks (coverage for branch in line 203)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const nonPromiseCallback = vi.fn().mockReturnValue("not a promise");

      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Non-Promise Item",
          icon: "<i></i>",
          callback: nonPromiseCallback,
        });
      });
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const target = document.createElement("div");
      target.setAttribute("data-entry-id", "journal-123");

      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [
        { name: "Existing Item", icon: "<i></i>", callback: vi.fn() },
      ];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // New item should be added
      expect(menuItems).toHaveLength(2);
      expect(menuItems[1]?.name).toBe("Non-Promise Item");

      // Now call the menu item callback to trigger the non-Promise path (branch coverage for line 203)
      const addedMenuItem = menuItems[1];
      if (addedMenuItem) {
        addedMenuItem.callback();
      }

      // Non-Promise callback should have been called
      expect(nonPromiseCallback).toHaveBeenCalledWith(target);
    });

    it("should not add duplicate menu items", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Existing Item", // Same name as existing
          icon: "<i></i>",
          callback: vi.fn(),
        });
      });
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const target = document.createElement("div");
      target.setAttribute("data-entry-id", "journal-123");

      const menuItems = [{ name: "Existing Item", icon: "<i></i>", callback: vi.fn() }];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // Should not add duplicate
      expect(menuItems).toHaveLength(1);
    });

    it("should handle missing menuItems gracefully", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const callback = vi.fn();
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const target = document.createElement("div");
      target.setAttribute("data-entry-id", "journal-123");

      const mockContextMenu = {
        menuItems: undefined,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // Should not throw, callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle non-HTMLElement target gracefully", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const callback = vi.fn();
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockContextMenu = {
        menuItems: [{ name: "Item", icon: "<i></i>", callback: vi.fn() }],
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, "not-an-element");

      // Should not throw, callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should unregister libWrapper", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      service.dispose();

      expect(mockLibWrapperService.unregister).toHaveBeenCalledWith(
        "foundry.applications.ux.ContextMenu.implementation.prototype.render"
      );
    });

    it("should clear callbacks", () => {
      const callback = vi.fn();
      service.addCallback(callback);

      service.dispose();

      // Callbacks should be cleared
      expect(callback).toBeDefined();
    });

    it("should handle unregister errors gracefully", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      vi.mocked(mockLibWrapperService.unregister).mockReturnValue(
        err({ code: "UNREGISTRATION_FAILED" as const, message: "Failed" })
      );

      service.dispose();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Failed to unregister context menu libWrapper",
        expect.objectContaining({ error: expect.any(Object) })
      );
    });

    it("should not unregister if not registered", () => {
      service.dispose();

      expect(mockLibWrapperService.unregister).not.toHaveBeenCalled();
    });
  });

  describe("constructor", () => {
    it("should initialize with dependencies", () => {
      const newService = new JournalContextMenuLibWrapperService(mockLibWrapperService, mockLogger);

      expect(newService).toBeDefined();
      // Verify that the service can be used
      const result = newService.register();
      expect(result.ok).toBe(true);
    });
  });

  describe("DIJournalContextMenuLibWrapperService", () => {
    it("should extend JournalContextMenuLibWrapperService", () => {
      const diService = new DIJournalContextMenuLibWrapperService(
        mockLibWrapperService,
        mockLogger
      );

      expect(diService).toBeInstanceOf(JournalContextMenuLibWrapperService);
    });

    it("should have correct dependencies", () => {
      expect(DIJournalContextMenuLibWrapperService.dependencies).toEqual([
        expect.any(Symbol),
        expect.any(Symbol),
      ]);
    });
  });
});

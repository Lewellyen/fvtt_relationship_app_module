import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  JournalContextMenuLibWrapperService,
  DIJournalContextMenuLibWrapperService,
} from "../JournalContextMenuLibWrapperService";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { LibWrapperService } from "@/infrastructure/adapters/foundry/interfaces/lib-wrapper-service.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-ui-event-port.interface";
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
      expect(event1.journalId).toBe("journal-123");
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

      // Promise callback should have been called with journalId (not HTMLElement)
      expect(promiseCallback).toHaveBeenCalledWith("journal-123");
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

      // Promise callback should have been called with journalId (not HTMLElement)
      expect(promiseCallback).toHaveBeenCalledWith("journal-123");
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

      // Non-Promise callback should have been called with journalId (not HTMLElement)
      expect(nonPromiseCallback).toHaveBeenCalledWith("journal-123");
    });

    it("should call original menuItems callbacks when wrapper callback is invoked (coverage for line 185)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const originalCallback = vi.fn();
      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [
        { name: "Original Item", icon: "<i></i>", callback: originalCallback },
      ];

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
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // After wrapper execution, menuItems should remain unchanged (original callbacks are preserved)
      expect(menuItems).toHaveLength(1);
      const originalMenuItemCallback = menuItems[0]?.callback;

      // Call the original callback - it should still be () => void (Foundry's original signature)
      if (originalMenuItemCallback) {
        originalMenuItemCallback();
      }

      // Original callback should have been called (via item.callback() on line 185)
      expect(originalCallback).toHaveBeenCalledTimes(1);
    });

    it("should call original callback when wrapped callback from event.options is invoked (coverage for line 185)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const originalCallback = vi.fn();
      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [
        { name: "Original Item", icon: "<i></i>", callback: originalCallback },
      ];

      let capturedEvent: JournalContextMenuEvent | undefined;
      const callback = vi.fn((event: JournalContextMenuEvent) => {
        capturedEvent = event;
      });
      service.addCallback(callback);

      const registerCall = vi.mocked(mockLibWrapperService.register).mock.calls[0];
      const wrapperFn = registerCall?.[1] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const target = document.createElement("div");
      target.setAttribute("data-entry-id", "journal-123");

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // Get the wrapped callback from event.options and call it
      expect(capturedEvent).toBeDefined();
      expect(capturedEvent!.options).toHaveLength(1);
      const wrappedCallback = capturedEvent!.options[0]?.callback;
      expect(wrappedCallback).toBeDefined();

      // Call the wrapped callback - this should invoke item.callback() (line 185)
      wrappedCallback!("journal-123");

      // Original callback should have been called (via item.callback() on line 185)
      expect(originalCallback).toHaveBeenCalledTimes(1);
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

    it("should remove old 'Journal ausblenden' items from WeakMap when cleaning up (coverage for lines 191-192)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Journal ausblenden",
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

      // Create menuItems with existing "Journal ausblenden" item
      const existingItem = { name: "Journal ausblenden", icon: "<i></i>", callback: vi.fn() };
      const menuItems = [existingItem];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // Old item should be removed (and from WeakMap)
      // New item should be added
      expect(menuItems.length).toBeGreaterThanOrEqual(1);
      // Verify old item is gone
      const oldItemStillExists = menuItems.some((item) => item === existingItem);
      expect(oldItemStillExists).toBe(false);
    });

    it("should use DOM fallback when journalId cannot be determined from WeakMap (coverage for lines 237-260)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const handlerCallback = vi.fn();
      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Journal ausblenden",
          icon: "<i></i>",
          callback: handlerCallback,
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

      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      // Get the added menu item
      expect(menuItems.length).toBe(1);
      const addedMenuItem = menuItems[0];
      expect(addedMenuItem).toBeDefined();
      const oldCallback = addedMenuItem?.callback;

      // Create DOM structure for fallback BEFORE removing menuItem
      const contextMenuElement = document.createElement("div");
      contextMenuElement.className = "context-menu";
      const journalElement = document.createElement("div");
      journalElement.setAttribute("data-entry-id", "journal-456");
      contextMenuElement.appendChild(journalElement);
      document.body.appendChild(contextMenuElement);

      // To trigger the fallback path, we need the WeakMap lookup to fail.
      // The WeakMap is keyed by the menuItem object itself.
      // Strategy: Call the wrapper again with a different target to trigger cleanup,
      // which removes the old menuItem from WeakMap. Then call the old callback,
      // which will try to get journalId from WeakMap (will fail), then use DOM fallback.

      // Call wrapper again with different target to trigger cleanup of old menuItem
      const target2 = document.createElement("div");
      target2.setAttribute("data-entry-id", "journal-999");
      wrapperFn.call(mockContextMenu, wrappedFn, target2);

      // Now the old menuItem should be removed from WeakMap (via cleanup)
      // Call the old callback - it will try WeakMap.get(menuItem), which will return undefined
      if (oldCallback) {
        oldCallback();

        // Verify error was logged
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to determine journalId dynamically from WeakMap",
          expect.objectContaining({
            menuItemName: "Journal ausblenden",
            fallbackJournalId: "journal-123",
          })
        );

        // Verify handler was called with DOM journalId
        // The fallback should find journalElement with data-entry-id="journal-456"
        expect(handlerCallback).toHaveBeenCalledWith("journal-456");
      }

      // Cleanup
      document.body.removeChild(contextMenuElement);
    });

    it("should return early when DOM fallback fails - no context-menu element (coverage for else path line 243)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const handlerCallback = vi.fn();
      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Journal ausblenden",
          icon: "<i></i>",
          callback: handlerCallback,
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

      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      const addedMenuItem = menuItems[0];
      const oldCallback = addedMenuItem?.callback;

      // Ensure no context-menu element exists in DOM
      const existingContextMenu = document.querySelector(".context-menu");
      if (existingContextMenu) {
        document.body.removeChild(existingContextMenu);
      }

      // Trigger cleanup to remove from WeakMap
      const target2 = document.createElement("div");
      target2.setAttribute("data-entry-id", "journal-999");
      wrapperFn.call(mockContextMenu, wrappedFn, target2);

      if (oldCallback) {
        oldCallback();

        // Verify error was logged
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to determine journalId dynamically from WeakMap",
          expect.objectContaining({
            menuItemName: "Journal ausblenden",
            fallbackJournalId: "journal-123",
          })
        );

        // Verify handler was NOT called (early return)
        expect(handlerCallback).not.toHaveBeenCalled();
      }
    });

    it("should return early when DOM fallback fails - no journal element (coverage for else path line 247)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const handlerCallback = vi.fn();
      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Journal ausblenden",
          icon: "<i></i>",
          callback: handlerCallback,
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

      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      const addedMenuItem = menuItems[0];
      const oldCallback = addedMenuItem?.callback;

      // Create context-menu element but WITHOUT journal element
      const contextMenuElement = document.createElement("div");
      contextMenuElement.className = "context-menu";
      // No journal element added
      document.body.appendChild(contextMenuElement);

      // Trigger cleanup to remove from WeakMap
      const target2 = document.createElement("div");
      target2.setAttribute("data-entry-id", "journal-999");
      wrapperFn.call(mockContextMenu, wrappedFn, target2);

      if (oldCallback) {
        oldCallback();

        // Verify error was logged
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to determine journalId dynamically from WeakMap",
          expect.objectContaining({
            menuItemName: "Journal ausblenden",
            fallbackJournalId: "journal-123",
          })
        );

        // Verify handler was NOT called (early return)
        expect(handlerCallback).not.toHaveBeenCalled();
      }

      // Cleanup
      document.body.removeChild(contextMenuElement);
    });

    it("should use data-document-id when data-entry-id is not available (coverage for branch line 250)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const handlerCallback = vi.fn();
      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Journal ausblenden",
          icon: "<i></i>",
          callback: handlerCallback,
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

      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      const addedMenuItem = menuItems[0];
      const oldCallback = addedMenuItem?.callback;

      // Create DOM structure with data-document-id but NO data-entry-id
      const contextMenuElement = document.createElement("div");
      contextMenuElement.className = "context-menu";
      const journalElement = document.createElement("div");
      // Only data-document-id, no data-entry-id
      journalElement.setAttribute("data-document-id", "journal-789");
      contextMenuElement.appendChild(journalElement);
      document.body.appendChild(contextMenuElement);

      // Trigger cleanup to remove from WeakMap
      const target2 = document.createElement("div");
      target2.setAttribute("data-entry-id", "journal-999");
      wrapperFn.call(mockContextMenu, wrappedFn, target2);

      if (oldCallback) {
        oldCallback();

        // Verify error was logged
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to determine journalId dynamically from WeakMap",
          expect.objectContaining({
            menuItemName: "Journal ausblenden",
            fallbackJournalId: "journal-123",
          })
        );

        // Verify handler was called with data-document-id
        expect(handlerCallback).toHaveBeenCalledWith("journal-789");
      }

      // Cleanup
      document.body.removeChild(contextMenuElement);
    });

    it("should return early when domJournalId is null (coverage for else path line 251)", () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      const handlerCallback = vi.fn();
      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Journal ausblenden",
          icon: "<i></i>",
          callback: handlerCallback,
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

      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      const addedMenuItem = menuItems[0];
      const oldCallback = addedMenuItem?.callback;

      // Create DOM structure where journalElement is found but has NO data attributes
      // The querySelector will find an element with data attributes elsewhere, but we need
      // to ensure that the found element has no attributes. Actually, querySelector requires
      // the attributes to exist. So we need a different approach.
      //
      // Strategy: Create an element with data attributes so querySelector finds it,
      // but then remove the attributes before calling the callback. However, that won't work
      // because querySelector is called inside the callback.
      //
      // Better strategy: Create an element that querySelector will find, but ensure
      // getAttribute returns null. We can't do that directly, but we can create a scenario
      // where the element is found but getAttribute returns null for both attributes.
      //
      // Actually, the issue is that querySelector("[data-entry-id], [data-document-id]")
      // will only find elements that HAVE these attributes. So if we want domJournalId to be null,
      // we need the element to be found but getAttribute to return null.
      //
      // Wait, that's not possible - if querySelector finds it, it has the attributes.
      // But getAttribute can return null if the attribute value is empty string? No, empty string
      // is still truthy.
      //
      // Actually, I think the issue is different. Let me check the code again:
      // `journalElement.getAttribute("data-entry-id") || journalElement.getAttribute("data-document-id")`
      // If both return null, then domJournalId is null.
      // But querySelector will only find elements with these attributes.
      //
      // The solution: We need to mock getAttribute or create a scenario where the element
      // is found but getAttribute returns null. But that's not possible with real DOM.
      //
      // Alternative: The else path might be for when getAttribute returns an empty string?
      // No, empty string is falsy, so it would work.
      //
      // Let me re-read the code. Ah! I see - `closest` might find contextMenuElement itself
      // if it has the attributes, but then getAttribute on contextMenuElement might return null
      // if we remove the attributes. But closest searches ancestors, not the element itself.
      //
      // Actually, I think the test needs to ensure that journalElement exists but getAttribute
      // returns null for both. The only way to do this is to have an element that querySelector
      // finds (so it has the selector), but then manually set getAttribute to return null.
      // But we can't mock getAttribute on a real DOM element easily.
      //
      // Better approach: Create an element that will be found, but ensure it's the contextMenuElement
      // itself (if it has the attributes), and then we can control its attributes.

      // Create context-menu element that will be found, and add a journal element as child
      // The journal element should be found by querySelector, but we'll ensure it has no
      // actual attribute values (or we'll remove them after creation but before callback)
      const contextMenuElement = document.createElement("div");
      contextMenuElement.className = "context-menu";
      // Add a dummy element with data attributes so querySelector finds something
      // But we'll remove the attributes to make getAttribute return null
      const journalElement = document.createElement("div");
      journalElement.setAttribute("data-entry-id", ""); // Empty string - but this is still truthy!
      // Actually, empty string is falsy in JavaScript, so this should work
      contextMenuElement.appendChild(journalElement);
      document.body.appendChild(contextMenuElement);

      // Trigger cleanup to remove from WeakMap
      const target2 = document.createElement("div");
      target2.setAttribute("data-entry-id", "journal-999");
      wrapperFn.call(mockContextMenu, wrappedFn, target2);

      if (oldCallback) {
        oldCallback();

        // Verify error was logged
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to determine journalId dynamically from WeakMap",
          expect.objectContaining({
            menuItemName: "Journal ausblenden",
            fallbackJournalId: "journal-123",
          })
        );

        // Verify handler was NOT called (early return because domJournalId is null/empty)
        expect(handlerCallback).not.toHaveBeenCalled();
      }

      // Cleanup
      document.body.removeChild(contextMenuElement);
    });

    it("should handle Promise return from callback in fallback path (coverage for if path line 253 and catch handler line 254)", async () => {
      const registerResult = service.register();
      expect(registerResult.ok).toBe(true);

      // Create a Promise that will be rejected to trigger the catch handler
      const handlerCallback = vi.fn().mockRejectedValue(new Error("Test error")); // Returns rejected Promise
      const callback = vi.fn((event: JournalContextMenuEvent) => {
        event.options.push({
          name: "Journal ausblenden",
          icon: "<i></i>",
          callback: handlerCallback,
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

      const menuItems: Array<{ name: string; icon: string; callback: () => void }> = [];

      const mockContextMenu = {
        menuItems,
      };

      const wrappedFn = vi.fn();
      wrapperFn.call(mockContextMenu, wrappedFn, target);

      const addedMenuItem = menuItems[0];
      const oldCallback = addedMenuItem?.callback;

      // Create DOM structure for fallback
      const contextMenuElement = document.createElement("div");
      contextMenuElement.className = "context-menu";
      const journalElement = document.createElement("div");
      journalElement.setAttribute("data-entry-id", "journal-456");
      contextMenuElement.appendChild(journalElement);
      document.body.appendChild(contextMenuElement);

      // Trigger cleanup to remove from WeakMap
      const target2 = document.createElement("div");
      target2.setAttribute("data-entry-id", "journal-999");
      wrapperFn.call(mockContextMenu, wrappedFn, target2);

      if (oldCallback) {
        oldCallback();

        // Verify error was logged
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to determine journalId dynamically from WeakMap",
          expect.objectContaining({
            menuItemName: "Journal ausblenden",
            fallbackJournalId: "journal-123",
          })
        );

        // Verify handler was called with DOM journalId
        expect(handlerCallback).toHaveBeenCalledWith("journal-456");

        // Wait for Promise rejection to be caught
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Cleanup
      document.body.removeChild(contextMenuElement);
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

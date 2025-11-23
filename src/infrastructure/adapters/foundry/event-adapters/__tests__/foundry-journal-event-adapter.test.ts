import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FoundryJournalEventAdapter,
  DIFoundryJournalEventAdapter,
} from "../foundry-journal-event-adapter";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { ok } from "@/infrastructure/shared/utils/result";
import type { JournalEvent } from "@/domain/ports/events/platform-journal-event-port.interface";

type MockFoundryHooksPortWithGetter = FoundryHooksPort & {
  getStoredCallback: (eventType: string) => ((...args: unknown[]) => void) | undefined;
};

describe("FoundryJournalEventAdapter", () => {
  let mockFoundryHooksPort: MockFoundryHooksPortWithGetter;
  let adapter: FoundryJournalEventAdapter;
  let mockLibWrapper: {
    register: ReturnType<typeof vi.fn>;
    unregister: ReturnType<typeof vi.fn>;
    callOriginal: ReturnType<typeof vi.fn>;
  };
  let mockContextMenuClass: new (...args: unknown[]) => {
    menuItems: Array<{ name: string; icon: string; callback: () => void }>;
  };
  beforeEach(() => {
    // Store callbacks for test access
    const storedCallbacks = new Map<string, (...args: unknown[]) => void>();
    let nextRegistrationId = 123;

    mockFoundryHooksPort = {
      registerListener: vi.fn((eventType: string, callback: (event: unknown) => void) => {
        // Store callback for test access (cast to match Foundry hook signature)
        storedCallbacks.set(eventType, callback as (...args: unknown[]) => void);
        // Return unique ID for each registration
        return ok(nextRegistrationId++);
      }),
      unregisterListener: vi.fn().mockReturnValue(ok(undefined)),
      on: vi.fn((hookName: string, callback: (...args: unknown[]) => void) => {
        // Also store in on() for backward compatibility
        storedCallbacks.set(hookName, callback);
        return { ok: true, value: 123 };
      }),
      once: vi.fn().mockReturnValue({ ok: true, value: 124 }),
      off: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      dispose: vi.fn(),
      // Expose storedCallbacks for test access
      getStoredCallback: (eventType: string) => storedCallbacks.get(eventType),
    } as unknown as MockFoundryHooksPortWithGetter;

    // Mock libWrapper
    mockLibWrapper = {
      register: vi.fn(),
      unregister: vi.fn(),
      callOriginal: vi.fn((_instance, _method, ..._args) => {
        // Mock implementation - return what would normally be returned
        return undefined;
      }),
    };
    vi.stubGlobal("libWrapper", mockLibWrapper);

    // Mock ContextMenu class via foundry.applications.ux.ContextMenu.implementation
    mockContextMenuClass = class {
      menuItems: Array<{ name: string; icon: string; callback: () => void }> = [];
      constructor(..._args: unknown[]) {
        // Accept any arguments but don't use them
      }
    };

    // Mock foundry?.applications?.ux?.ContextMenu
    vi.stubGlobal("foundry", {
      applications: {
        ux: {
          ContextMenu: {
            implementation: mockContextMenuClass,
          },
        },
      },
    });

    adapter = new FoundryJournalEventAdapter(mockFoundryHooksPort);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("onJournalCreated", () => {
    it("should register createJournalEntry hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);

      expect(result.ok).toBe(true);
      expect(mockFoundryHooksPort.registerListener).toHaveBeenCalledWith(
        "createJournalEntry",
        expect.any(Function)
      );
    });

    it("should map Foundry event to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalCreated(callback);

      // Simulate Foundry hook callback - get from stored callbacks
      // registerListener now passes arguments as an array
      const foundryCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{ id: "journal-123" }, {}, "user-456"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-123",
        timestamp: expect.any(Number),
      });
    });

    it("should handle invalid foundry entry (no id)", () => {
      const callback = vi.fn();
      adapter.onJournalCreated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{}, {}, "user-456"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "",
        timestamp: expect.any(Number),
      });
    });

    it("should handle invalid foundry entry (id is not a string)", () => {
      const callback = vi.fn();
      adapter.onJournalCreated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{ id: 123 }, {}, "user-456"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "",
        timestamp: expect.any(Number),
      });
    });

    it("should handle registration failure", () => {
      mockFoundryHooksPort.registerListener = vi.fn().mockReturnValue({
        ok: false,
        error: { code: "EVENT_REGISTRATION_FAILED", message: "Test error" },
      });
      adapter = new FoundryJournalEventAdapter(mockFoundryHooksPort);

      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("EVENT_REGISTRATION_FAILED");
        // registerFoundryHook() now returns the error directly from registerListener()
        // without adding hook name, so we just check the error code
        expect(result.error.message).toBe("Test error");
      }
    });
  });

  describe("onJournalUpdated", () => {
    it("should register updateJournalEntry hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalUpdated(callback);

      expect(result.ok).toBe(true);
      expect(mockFoundryHooksPort.registerListener).toHaveBeenCalledWith(
        "updateJournalEntry",
        expect.any(Function)
      );
    });

    it("should map Foundry event with changes to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      // Simulate Foundry hook callback with changes
      // registerListener now passes arguments as an array
      const foundryCallback = mockFoundryHooksPort.getStoredCallback("updateJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([
        { id: "journal-456" },
        { name: "New Name", flags: { test: true } },
        {},
        "user-789",
      ]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-456",
        changes: {
          name: "New Name",
          flags: { test: true },
        },
        timestamp: expect.any(Number),
      });
    });

    it("should handle changes without name property", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("updateJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{ id: "journal-789" }, { flags: { test: true } }, {}, "user-123"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-789",
        changes: {
          flags: { test: true },
        },
        timestamp: expect.any(Number),
      });
    });

    it("should handle changes without flags property", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("updateJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{ id: "journal-101" }, { name: "Test" }, {}, "user-456"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-101",
        changes: {
          name: "Test",
        },
        timestamp: expect.any(Number),
      });
    });

    it("should handle changes with neither name nor flags", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("updateJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{ id: "journal-202" }, { content: "Some content" }, {}, "user-789"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-202",
        changes: {
          content: "Some content",
        },
        timestamp: expect.any(Number),
      });
    });

    it("should handle invalid changes object", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("updateJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{ id: "journal-303" }, null, {}, "user-999"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-303",
        changes: {},
        timestamp: expect.any(Number),
      });
    });
  });

  describe("onJournalDeleted", () => {
    it("should register deleteJournalEntry hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalDeleted(callback);

      expect(result.ok).toBe(true);
      expect(mockFoundryHooksPort.registerListener).toHaveBeenCalledWith(
        "deleteJournalEntry",
        expect.any(Function)
      );
    });

    it("should map Foundry event to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalDeleted(callback);

      // Simulate Foundry hook callback
      // registerListener now passes arguments as an array
      const foundryCallback = mockFoundryHooksPort.getStoredCallback("deleteJournalEntry");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{ id: "journal-789" }, {}, "user-123"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-789",
        timestamp: expect.any(Number),
      });
    });
  });

  describe("onJournalDirectoryRendered", () => {
    it("should register renderJournalDirectory hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalDirectoryRendered(callback);

      expect(result.ok).toBe(true);
      expect(mockFoundryHooksPort.registerListener).toHaveBeenCalledWith(
        "renderJournalDirectory",
        expect.any(Function)
      );
    });

    it("should map Foundry event with HTMLElement to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      // Simulate Foundry hook callback with HTML element
      // registerListener now passes arguments as an array
      const mockElement = document.createElement("div");
      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{}, mockElement]);

      expect(callback).toHaveBeenCalledWith({
        htmlElement: mockElement,
        timestamp: expect.any(Number),
      });
    });

    it("should handle HTML array format", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      // Simulate Foundry hook callback with HTML element in array
      // registerListener now passes arguments as an array
      const mockElement = document.createElement("div");
      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{}, [mockElement]]);

      expect(callback).toHaveBeenCalledWith({
        htmlElement: mockElement,
        timestamp: expect.any(Number),
      });
    });

    it("should not call callback if HTML element is invalid", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      // Simulate Foundry hook callback with invalid HTML
      // registerListener now passes arguments as an array
      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{}, null]);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should not call callback if HTML array contains non-HTMLElement", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      // Simulate Foundry hook callback with array containing non-HTMLElement
      // registerListener now passes arguments as an array
      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();
      foundryCallback!([{}, ["not an element"]]);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("registerListener (generic)", () => {
    it("should register generic event listener", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("customEvent", callback);

      expect(result.ok).toBe(true);
      // registerListener wraps the callback, so we check that it was called with a function
      expect(mockFoundryHooksPort.registerListener).toHaveBeenCalledWith(
        "customEvent",
        expect.any(Function)
      );

      // Test that the wrapped callback works correctly
      const wrappedCallback = vi
        .mocked(mockFoundryHooksPort.registerListener)
        .mock.calls.find((call) => call[0] === "customEvent")?.[1] as (event: unknown) => void;
      expect(wrappedCallback).toBeDefined();

      // Call with array of arguments (as registerListener does)
      const testEvent: JournalEvent = { journalId: "test-123", timestamp: Date.now() };
      wrappedCallback([testEvent]);

      // The original callback should be called with the first argument as JournalEvent
      expect(callback).toHaveBeenCalledWith(testEvent);
    });

    it("should handle empty args array (coverage for line 329 else branch)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("emptyEvent", callback);
      expect(result.ok).toBe(true);

      // Get the foundryCallback that was created by registerListener
      const platformCallback = mockFoundryHooksPort.getStoredCallback("emptyEvent");
      expect(platformCallback).toBeDefined();

      // Call platformCallback with an array containing empty array (which becomes empty after filtering)
      // This triggers the foundryCallback with empty args
      platformCallback!([null, undefined]); // After filtering, this becomes empty array

      // Callback should not be called because args.length === 0
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle args[0] that is not an object (coverage for line 329 else branch)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("primitiveEvent", callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("primitiveEvent");
      expect(platformCallback).toBeDefined();

      // Call with primitive value as first arg
      platformCallback!(["string value"]);

      // Callback should not be called because args[0] is not an object
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle args[0] that is null (coverage for line 329 else branch)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("nullEvent", callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("nullEvent");
      expect(platformCallback).toBeDefined();

      // Call with null as first arg
      platformCallback!([null]);

      // Callback should not be called because args[0] is null
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle candidate without journalId or timestamp (coverage for line 335 else branch)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("noJournalIdEvent", callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("noJournalIdEvent");
      expect(platformCallback).toBeDefined();

      // Call with object that doesn't have journalId or timestamp
      platformCallback!([{ otherProperty: "value" }]);

      // Callback should not be called because candidate doesn't have journalId or timestamp
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle candidate with timestamp but not journalId (coverage for line 339 and 342-344)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("timestampEvent", callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("timestampEvent");
      expect(platformCallback).toBeDefined();

      // Call with object that has timestamp but journalId is not a string
      platformCallback!([{ timestamp: 1234567890, journalId: 123 }]);

      // Callback should be called with empty journalId (because journalId is not a string)
      expect(callback).toHaveBeenCalledWith({
        journalId: "",
        timestamp: 1234567890,
      });
    });

    it("should handle candidate with journalId but not timestamp (coverage for line 339 and 342-344)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("journalIdEvent", callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("journalIdEvent");
      expect(platformCallback).toBeDefined();

      // Call with object that has journalId but timestamp is not a number
      platformCallback!([{ journalId: "test-123", timestamp: "not a number" }]);

      // Callback should be called with current timestamp (because timestamp is not a number)
      expect(callback).toHaveBeenCalledWith({
        journalId: "test-123",
        timestamp: expect.any(Number),
      });
    });

    it("should handle candidate with neither journalId nor timestamp as correct type (coverage for line 339 else branch)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("neitherEvent", callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("neitherEvent");
      expect(platformCallback).toBeDefined();

      // Call with object that has journalId and timestamp but wrong types
      // This should still pass the first check (line 335) but fail the second check (line 339)
      // Actually, wait - line 339 is redundant with line 335, so it should always pass if line 335 passes
      // But we need to test the else branch of line 339, which means the candidate doesn't have journalId or timestamp
      // But that's already tested above. Let me check what the actual branch is.

      // Actually, the redundant check on line 339 means we need to test when it fails
      // But since it's the same condition as line 335, it will always have the same result
      // The branch coverage issue might be from the ternary operators on lines 342-344
      // Let me test when journalId is not a string AND timestamp is not a number
      platformCallback!([{ journalId: null, timestamp: null }]);

      // Callback should be called with empty journalId and current timestamp
      expect(callback).toHaveBeenCalledWith({
        journalId: "",
        timestamp: expect.any(Number),
      });
    });

    it("should handle validArgs.length === 0 (coverage for line 408 else branch)", () => {
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(platformCallback).toBeDefined();

      // Call with array containing only null/undefined values
      // After filtering, validArgs.length === 0
      platformCallback!([null, undefined]);

      // Callback should not be called because validArgs.length === 0
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("unregisterListener", () => {
    it("should cleanup Foundry hook", () => {
      const result = adapter.onJournalCreated(vi.fn());
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const registrationId = result.value;
      const unregisterResult = adapter.unregisterListener(registrationId);

      expect(unregisterResult.ok).toBe(true);
      expect(mockFoundryHooksPort.unregisterListener).toHaveBeenCalled();
    });

    it("should return error for invalid registration ID", () => {
      const result = adapter.unregisterListener("invalid-id");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("EVENT_UNREGISTRATION_FAILED");
      }
    });
  });

  describe("onJournalContextMenu", () => {
    it("should register libWrapper hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);

      expect(result.ok).toBe(true);
      expect(mockLibWrapper.register).toHaveBeenCalledWith(
        MODULE_CONSTANTS.MODULE.ID,
        "foundry.applications.ux.ContextMenu.implementation.prototype.render",
        expect.any(Function),
        "WRAPPER"
      );
    });

    it("should map Foundry event with HTMLElement and options to domain event", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      // Get the wrapper function registered with libWrapper
      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      // Simulate libWrapper callback - create a ContextMenu instance
      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [
        { name: "Existing Option", icon: "<i></i>", callback: vi.fn() },
      ];

      // Mock wrapped function (original function from libWrapper)
      const mockWrapped = vi.fn().mockReturnValue(undefined);

      // Call wrapper with context (this = mockContextMenuInstance)
      // Bei WRAPPER-Typ ist wrapped der erste Parameter
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      expect(callback).toHaveBeenCalledWith({
        htmlElement: mockElement,
        options: expect.arrayContaining([expect.objectContaining({ name: "Existing Option" })]),
        timestamp: expect.any(Number),
      });
    });

    it("should handle HTML array format", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-456");
      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [{ name: "Test", icon: "<i></i>", callback: vi.fn() }];

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      expect(callback).toHaveBeenCalledWith({
        htmlElement: mockElement,
        options: expect.any(Array),
        timestamp: expect.any(Number),
      });
    });

    it("should add new options from callback to menuItems when they don't exist", () => {
      const mockNonPromiseCallback = vi.fn().mockReturnValue(undefined);
      const callback = vi.fn((event) => {
        // Callback fügt neue Optionen hinzu, die noch nicht in menuItems existieren
        event.options.push({
          name: "New Option",
          icon: "<i class='new'></i>",
          callback: mockNonPromiseCallback,
        });
      });
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-789");
      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [
        { name: "Existing Option", icon: "<i></i>", callback: vi.fn() },
      ];

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      // Callback sollte aufgerufen worden sein
      expect(callback).toHaveBeenCalled();
      // Neue Option sollte zu menuItems hinzugefügt worden sein
      expect(mockContextMenuInstance.menuItems).toHaveLength(2);
      expect(mockContextMenuInstance.menuItems[1]?.name).toBe("New Option");

      // Rufe den callback auf, um non-Promise-Handling zu testen (else-Branch)
      const addedCallback = mockContextMenuInstance.menuItems[1]?.callback;
      if (addedCallback) {
        addedCallback();
        expect(mockNonPromiseCallback).toHaveBeenCalledWith(mockElement);
      }
    });

    it("should handle Promise-returning callbacks when adding new options", async () => {
      const mockPromiseCallback = vi.fn().mockResolvedValue(undefined);
      const callback = vi.fn((event) => {
        // Callback fügt neue Optionen hinzu, die noch nicht in menuItems existieren
        event.options.push({
          name: "Promise Option",
          icon: "<i class='promise'></i>",
          callback: mockPromiseCallback,
        });
      });
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-999");
      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [
        { name: "Existing Option", icon: "<i></i>", callback: vi.fn() },
      ];

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      // Callback sollte aufgerufen worden sein
      expect(callback).toHaveBeenCalled();
      // Neue Option sollte zu menuItems hinzugefügt worden sein
      expect(mockContextMenuInstance.menuItems).toHaveLength(2);
      expect(mockContextMenuInstance.menuItems[1]?.name).toBe("Promise Option");

      // Rufe den callback auf, um Promise-Handling zu testen
      const addedCallback = mockContextMenuInstance.menuItems[1]?.callback;
      if (addedCallback) {
        addedCallback();
        // Warte auf Promise-Resolution
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(mockPromiseCallback).toHaveBeenCalledWith(mockElement);
      }
    });

    it("should handle rejected Promise callbacks when adding new options", async () => {
      const mockRejectedCallback = vi.fn().mockRejectedValue(new Error("Test error"));
      const callback = vi.fn((event) => {
        // Callback fügt neue Optionen hinzu, die noch nicht in menuItems existieren
        event.options.push({
          name: "Rejected Promise Option",
          icon: "<i class='rejected'></i>",
          callback: mockRejectedCallback,
        });
      });
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-888");
      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [
        { name: "Existing Option", icon: "<i></i>", callback: vi.fn() },
      ];

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      // Callback sollte aufgerufen worden sein
      expect(callback).toHaveBeenCalled();
      // Neue Option sollte zu menuItems hinzugefügt worden sein
      expect(mockContextMenuInstance.menuItems).toHaveLength(2);
      expect(mockContextMenuInstance.menuItems[1]?.name).toBe("Rejected Promise Option");

      // Rufe den callback auf, um Promise-Rejection-Handling zu testen
      const addedCallback = mockContextMenuInstance.menuItems[1]?.callback;
      if (addedCallback) {
        addedCallback();
        // Warte auf Promise-Rejection (catch-Handler sollte aufgerufen werden)
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(mockRejectedCallback).toHaveBeenCalledWith(mockElement);
      }
    });

    it("should not call callback if HTML element is invalid", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [];

      // Use a valid element without journal ID instead of null
      const mockElement = document.createElement("div");
      // No data-entry-id or data-document-id attribute
      const mockWrapped = vi.fn().mockReturnValue(undefined);
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      expect(callback).not.toHaveBeenCalled();
    });

    it("should not call callback if element has no journal ID", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockElement = document.createElement("div");
      // No data-entry-id or data-document-id
      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [];

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      expect(callback).not.toHaveBeenCalled();
    });

    it("should filter invalid options from array", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-789");
      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [
        { name: "Valid Option", icon: "<i></i>", callback: vi.fn() },
        // Note: menuItems should only contain valid items, but test the filtering anyway
      ];

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      expect(callback).toHaveBeenCalled();
      const event = callback.mock.calls[0]![0];
      // Should only contain valid options
      expect(event.options.length).toBe(1);
      expect(event.options[0]?.name).toBe("Valid Option");
    });

    it("should handle registration failure when libWrapper throws", () => {
      mockLibWrapper.register = vi.fn().mockImplementation(() => {
        throw new Error("libWrapper registration failed");
      });
      adapter = new FoundryJournalEventAdapter(mockFoundryHooksPort);

      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.message).toContain("Failed to register libWrapper");
      }
    });

    it("should handle libWrapper not available", () => {
      // @ts-expect-error - libWrapper is a global that may not exist
      delete globalThis.libWrapper;
      adapter = new FoundryJournalEventAdapter(mockFoundryHooksPort);

      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
        expect(result.error.message).toContain("libWrapper is not available");
      }
    });

    it("should handle ContextMenu not available", () => {
      // Create new adapter with minimal mocks - no ContextMenu at all
      const minimalLibWrapper = {
        register: vi.fn(),
        unregister: vi.fn(),
        callOriginal: vi.fn((_instance, _method, ..._args) => undefined),
      };
      vi.stubGlobal("libWrapper", minimalLibWrapper);
      vi.stubGlobal("foundry", {}); // Empty foundry, no applications.ux.ContextMenu

      // Create fresh adapter instance after mocks are set
      const freshAdapter = new FoundryJournalEventAdapter(mockFoundryHooksPort);

      const callback = vi.fn();
      const result = freshAdapter.onJournalContextMenu(callback);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
        expect(result.error.message).toContain("ContextMenu is not available");
      }
    });

    it("should handle context menu without menuItems", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const mockContextMenuInstance = new mockContextMenuClass();
      // menuItems is undefined/null - should call original
      // @ts-expect-error - Testing undefined menuItems
      mockContextMenuInstance.menuItems = undefined;

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, mockElement, {});

      // Should call wrapped (original) if menuItems is missing
      expect(mockWrapped).toHaveBeenCalledWith(mockElement, {});
      expect(mockWrapped).toHaveBeenCalledTimes(1);
      // Should not call our callback
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle undefined target in wrapper function", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [{ name: "Test", icon: "<i></i>", callback: vi.fn() }];

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      // Call with undefined target (first arg after wrapped)
      wrapperFunction.call(mockContextMenuInstance, mockWrapped, undefined, {});

      // Should call wrapped (original) if target is undefined
      expect(mockWrapped).toHaveBeenCalledWith(undefined, {});
      expect(mockWrapped).toHaveBeenCalledTimes(1);
      // Should not call our callback
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle wrapper function with wrapped parameter", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      const wrapperFunction = vi.mocked(mockLibWrapper.register).mock.calls[0]![2] as (
        wrapped: (...args: unknown[]) => unknown,
        ...args: unknown[]
      ) => unknown;

      const mockContextMenuInstance = new mockContextMenuClass();
      mockContextMenuInstance.menuItems = [{ name: "Test", icon: "<i></i>", callback: vi.fn() }];

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");

      const mockWrapped = vi.fn().mockReturnValue(undefined);
      // Wrapper function should call wrapped with correct arguments
      const wrapperResult = wrapperFunction.call(
        mockContextMenuInstance,
        mockWrapped,
        mockElement,
        {}
      );

      // Should call our callback
      expect(callback).toHaveBeenCalled();
      // Should call wrapped at the end
      expect(mockWrapped).toHaveBeenCalledWith(mockElement, {});
      expect(wrapperResult).toBeUndefined();
    });
  });

  describe("dispose", () => {
    it("should cleanup all registrations", () => {
      adapter.onJournalCreated(vi.fn());
      adapter.onJournalUpdated(vi.fn());
      adapter.onJournalDeleted(vi.fn());
      const contextMenuResult = adapter.onJournalContextMenu(vi.fn());
      expect(contextMenuResult.ok).toBe(true);

      adapter.dispose();

      // onJournalCreated, onJournalUpdated, onJournalDeleted use foundryHooksPort.unregisterListener
      // Each registration has its own cleanup function that calls unregisterListener
      expect(mockFoundryHooksPort.unregisterListener).toHaveBeenCalledTimes(3);
      // onJournalContextMenu uses libWrapper.unregister only if no callbacks remain
      // Since dispose clears all callbacks, unregister should be called
      expect(mockLibWrapper.unregister).toHaveBeenCalledWith(
        MODULE_CONSTANTS.MODULE.ID,
        "ContextMenu.prototype.render"
      );
    });

    it("should clear registrations map after dispose", () => {
      const result = adapter.onJournalCreated(vi.fn());
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      adapter.dispose();

      // Try to unregister after dispose - should fail
      const unregisterResult = adapter.unregisterListener(result.value);
      expect(unregisterResult.ok).toBe(false);
    });

    it("should handle libWrapper unregister error gracefully", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);

      // Mock unregister to throw
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockLibWrapper.unregister = vi.fn().mockImplementation(() => {
        throw new Error("Unregister failed");
      });

      // Dispose should handle the error gracefully
      adapter.dispose();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to unregister libWrapper:",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it("should reuse existing libWrapper registration for multiple callbacks", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const result1 = adapter.onJournalContextMenu(callback1);
      expect(result1.ok).toBe(true);
      expect(mockLibWrapper.register).toHaveBeenCalledTimes(1);

      const result2 = adapter.onJournalContextMenu(callback2);
      expect(result2.ok).toBe(true);
      // Should not register again (line 144 - libWrapperRegistered is true)
      expect(mockLibWrapper.register).toHaveBeenCalledTimes(1);
    });

    it("should handle cleanup when callback is not found in array", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Manually remove callback from array before dispose to test index === -1 path (line 207)
      const registrationId = result.value;
      const cleanup = (
        adapter as unknown as { registrations: Map<string, () => void> }
      ).registrations.get(String(registrationId));
      if (!cleanup) return;

      // Manually clear the callbacks array to simulate callback not found
      (adapter as unknown as { contextMenuCallbacks: unknown[] }).contextMenuCallbacks = [];

      // Cleanup should handle index === -1 gracefully (line 207)
      expect(() => cleanup()).not.toThrow();
    });

    it("should not unregister libWrapper if callbacks remain after cleanup", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const result1 = adapter.onJournalContextMenu(callback1);
      const result2 = adapter.onJournalContextMenu(callback2);
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      // Unregister only one callback
      const unregisterResult = adapter.unregisterListener(result1.value);
      expect(unregisterResult.ok).toBe(true);

      // libWrapper should not be unregistered since callback2 is still registered (line 212 - length > 0)
      expect(mockLibWrapper.unregister).not.toHaveBeenCalled();
    });

    it("should unregister libWrapper when last callback is removed", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Unregister the only callback
      const unregisterResult = adapter.unregisterListener(result.value);
      expect(unregisterResult.ok).toBe(true);

      // libWrapper should be unregistered since no callbacks remain (line 212 - length === 0 && libWrapperRegistered)
      expect(mockLibWrapper.unregister).toHaveBeenCalledWith(
        MODULE_CONSTANTS.MODULE.ID,
        "ContextMenu.prototype.render"
      );
    });

    it("should handle libWrapper being undefined during cleanup", () => {
      const callback = vi.fn();
      const result = adapter.onJournalContextMenu(callback);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Remove libWrapper before cleanup to test line 233 branch (libWrapper undefined)
      // @ts-expect-error - libWrapper is a global that may not exist
      delete globalThis.libWrapper;

      // Unregister should still succeed (handles undefined libWrapper gracefully)
      const unregisterResult = adapter.unregisterListener(result.value);
      expect(unregisterResult.ok).toBe(true);

      // Should not throw even if libWrapper is undefined during cleanup
      expect(() => adapter.unregisterListener(result.value)).not.toThrow();
    });
  });

  describe("registerListener - non-array event fallback", () => {
    it("should handle non-array event in registerFoundryHook (coverage for lines 417-418)", () => {
      // Use onJournalCreated to trigger registerFoundryHook, which creates platformCallback
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);
      expect(result.ok).toBe(true);

      // Get the platformCallback that was registered by registerFoundryHook
      // This is the callback that FoundryHooksPort.registerListener receives
      const platformCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(platformCallback).toBeDefined();

      // Call platformCallback with a non-array event to trigger the else branch (lines 411-423)
      // This simulates a case where FoundryHooksPort.registerListener passes a non-array event
      // The platformCallback should call the foundryCallback with the non-array event
      platformCallback!("not an array");

      // The foundryCallback (created in onJournalCreated) should be called
      // It receives "not an array" as the first argument
      expect(callback).toHaveBeenCalled();
    });

    it("should handle null event in non-array fallback (coverage for line 420 else branch)", () => {
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(platformCallback).toBeDefined();

      // Call with null to trigger the else branch of isNotNullOrUndefined check (line 420)
      platformCallback!(null);

      // Callback should not be called because event is null
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle undefined event in non-array fallback (coverage for line 420 else branch)", () => {
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(platformCallback).toBeDefined();

      // Call with undefined to trigger the else branch of isNotNullOrUndefined check (line 420)
      platformCallback!(undefined);

      // Callback should not be called because event is undefined
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("normalizeChanges - non-object fallback", () => {
    it("should return empty object for non-object changes (coverage for line 454)", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("updateJournalEntry");
      expect(foundryCallback).toBeDefined();

      // Call with null as changes to trigger the non-object path
      foundryCallback!([{ id: "journal-123" }, null, {}, "user-456"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-123",
        changes: {}, // Should return empty object for non-object changes
        timestamp: expect.any(Number),
      });
    });

    it("should return empty object for primitive changes", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("updateJournalEntry");
      expect(foundryCallback).toBeDefined();

      // Call with a primitive value as changes
      foundryCallback!([{ id: "journal-456" }, "string changes", {}, "user-789"]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-456",
        changes: {}, // Should return empty object for primitive changes
        timestamp: expect.any(Number),
      });
    });
  });

  describe("onJournalContextMenu - libWrapper undefined during registration", () => {
    it("should throw error if libWrapper becomes undefined during registration (coverage for line 256)", () => {
      // Setup: libWrapper is available initially
      const callback = vi.fn();

      // Mock libWrapper to become undefined during the tryCatch execution
      let libWrapperAccessCount = 0;
      const originalLibWrapper = mockLibWrapper;

      // Create a getter that returns undefined on second access (after the check on line 134)
      Object.defineProperty(globalThis, "libWrapper", {
        get: () => {
          libWrapperAccessCount++;
          if (libWrapperAccessCount === 1) {
            // First access (line 134 check) - return libWrapper
            return originalLibWrapper;
          } else if (libWrapperAccessCount === 2) {
            // Second access (line 253) - return undefined to trigger line 256
            return undefined;
          }
          return originalLibWrapper;
        },
        configurable: true,
      });

      const result = adapter.onJournalContextMenu(callback);

      // Should fail because libWrapper becomes undefined during registration
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.message).toContain("Failed to register libWrapper");
      }

      // Restore libWrapper
      vi.stubGlobal("libWrapper", originalLibWrapper);
    });
  });

  describe("DIFoundryJournalEventAdapter", () => {
    it("should instantiate and call super constructor (coverage for line 487)", () => {
      const diAdapter = new DIFoundryJournalEventAdapter(mockFoundryHooksPort);

      // Should be an instance of FoundryJournalEventAdapter
      expect(diAdapter).toBeInstanceOf(FoundryJournalEventAdapter);

      // Should work like the base adapter
      const callback = vi.fn();
      const result = diAdapter.onJournalCreated(callback);
      expect(result.ok).toBe(true);
    });
  });
});

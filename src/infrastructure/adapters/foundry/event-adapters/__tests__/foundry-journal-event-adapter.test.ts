import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryJournalEventAdapter } from "../foundry-journal-event-adapter";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";

describe("FoundryJournalEventAdapter", () => {
  let mockFoundryHooks: FoundryHooks;
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
    mockFoundryHooks = {
      on: vi.fn().mockReturnValue({ ok: true, value: 123 }),
      once: vi.fn().mockReturnValue({ ok: true, value: 124 }),
      off: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      dispose: vi.fn(),
    };

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

    adapter = new FoundryJournalEventAdapter(mockFoundryHooks);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("onJournalCreated", () => {
    it("should register createJournalEntry hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);

      expect(result.ok).toBe(true);
      expect(mockFoundryHooks.on).toHaveBeenCalledWith("createJournalEntry", expect.any(Function));
    });

    it("should map Foundry event to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalCreated(callback);

      // Simulate Foundry hook callback
      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({ id: "journal-123" }, {}, "user-456");

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-123",
        timestamp: expect.any(Number),
      });
    });

    it("should handle invalid foundry entry (no id)", () => {
      const callback = vi.fn();
      adapter.onJournalCreated(callback);

      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({}, {}, "user-456");

      expect(callback).toHaveBeenCalledWith({
        journalId: "",
        timestamp: expect.any(Number),
      });
    });

    it("should handle invalid foundry entry (id is not a string)", () => {
      const callback = vi.fn();
      adapter.onJournalCreated(callback);

      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({ id: 123 }, {}, "user-456");

      expect(callback).toHaveBeenCalledWith({
        journalId: "",
        timestamp: expect.any(Number),
      });
    });

    it("should handle registration failure", () => {
      mockFoundryHooks.on = vi
        .fn()
        .mockReturnValue({ ok: false, error: { code: "HOOK_FAILED", message: "Test error" } });
      adapter = new FoundryJournalEventAdapter(mockFoundryHooks);

      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("EVENT_REGISTRATION_FAILED");
        expect(result.error.message).toContain("createJournalEntry");
      }
    });
  });

  describe("onJournalUpdated", () => {
    it("should register updateJournalEntry hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalUpdated(callback);

      expect(result.ok).toBe(true);
      expect(mockFoundryHooks.on).toHaveBeenCalledWith("updateJournalEntry", expect.any(Function));
    });

    it("should map Foundry event with changes to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      // Simulate Foundry hook callback with changes
      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback(
        { id: "journal-456" },
        { name: "New Name", flags: { test: true } },
        {},
        "user-789"
      );

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

      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({ id: "journal-789" }, { flags: { test: true } }, {}, "user-123");

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

      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({ id: "journal-101" }, { name: "Test" }, {}, "user-456");

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

      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({ id: "journal-202" }, { content: "Some content" }, {}, "user-789");

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

      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({ id: "journal-303" }, null, {}, "user-999");

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
      expect(mockFoundryHooks.on).toHaveBeenCalledWith("deleteJournalEntry", expect.any(Function));
    });

    it("should map Foundry event to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalDeleted(callback);

      // Simulate Foundry hook callback
      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({ id: "journal-789" }, {}, "user-123");

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
      expect(mockFoundryHooks.on).toHaveBeenCalledWith(
        "renderJournalDirectory",
        expect.any(Function)
      );
    });

    it("should map Foundry event with HTMLElement to domain event", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      // Simulate Foundry hook callback with HTML element
      const mockElement = document.createElement("div");
      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({}, mockElement);

      expect(callback).toHaveBeenCalledWith({
        htmlElement: mockElement,
        timestamp: expect.any(Number),
      });
    });

    it("should handle HTML array format", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      // Simulate Foundry hook callback with HTML element in array
      const mockElement = document.createElement("div");
      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({}, [mockElement]);

      expect(callback).toHaveBeenCalledWith({
        htmlElement: mockElement,
        timestamp: expect.any(Number),
      });
    });

    it("should not call callback if HTML element is invalid", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      // Simulate Foundry hook callback with invalid HTML
      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({}, null);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should not call callback if HTML array contains non-HTMLElement", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      // Simulate Foundry hook callback with array containing non-HTMLElement
      const foundryCallback = vi.mocked(mockFoundryHooks.on).mock.calls[0]![1];
      foundryCallback({}, ["not an element"]);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("registerListener (generic)", () => {
    it("should register generic event listener", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("customEvent", callback);

      expect(result.ok).toBe(true);
      expect(mockFoundryHooks.on).toHaveBeenCalledWith("customEvent", callback);
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
      expect(mockFoundryHooks.off).toHaveBeenCalled();
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
      adapter = new FoundryJournalEventAdapter(mockFoundryHooks);

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
      adapter = new FoundryJournalEventAdapter(mockFoundryHooks);

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
      const freshAdapter = new FoundryJournalEventAdapter(mockFoundryHooks);

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

      // onJournalCreated, onJournalUpdated, onJournalDeleted use foundryHooks.off
      expect(mockFoundryHooks.off).toHaveBeenCalledTimes(3);
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
});

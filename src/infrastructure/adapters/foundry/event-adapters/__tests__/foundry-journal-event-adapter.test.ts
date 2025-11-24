import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FoundryJournalEventAdapter,
  DIFoundryJournalEventAdapter,
} from "../foundry-journal-event-adapter";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
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

  describe("dispose", () => {
    it("should cleanup all registrations", () => {
      adapter.onJournalCreated(vi.fn());
      adapter.onJournalUpdated(vi.fn());
      adapter.onJournalDeleted(vi.fn());

      adapter.dispose();

      // onJournalCreated, onJournalUpdated, onJournalDeleted use foundryHooksPort.unregisterListener
      // Each registration has its own cleanup function that calls unregisterListener
      expect(mockFoundryHooksPort.unregisterListener).toHaveBeenCalledTimes(3);
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

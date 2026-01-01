import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FoundryJournalEventAdapter,
  DIFoundryJournalEventAdapter,
} from "../foundry-journal-event-adapter";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { ok } from "@/domain/utils/result";

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

  // NOTE: onJournalDirectoryRendered has been moved to PlatformJournalUiEventPort
  // Tests for this method are now in foundry-journal-ui-event-adapter.test.ts

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

  describe("registerFoundryHook - edge cases", () => {
    it("should handle array with only null/undefined values (validArgs.length === 0)", () => {
      // Use onJournalCreated to trigger registerFoundryHook, which creates platformCallback
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);
      expect(result.ok).toBe(true);

      // Get the platformCallback that was registered by registerFoundryHook
      const platformCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(platformCallback).toBeDefined();

      // Call with array containing only null/undefined values
      // After filtering with isValidArg, validArgs.length === 0
      // This should NOT call the callback (coverage for line 141 else branch)
      platformCallback!([null, undefined, null]);

      // Callback should not be called because validArgs.length === 0
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle non-array event in registerFoundryHook", () => {
      // Use onJournalCreated to trigger registerFoundryHook, which creates platformCallback
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);
      expect(result.ok).toBe(true);

      // Get the platformCallback that was registered by registerFoundryHook
      // This is the callback that FoundryHooksPort.registerListener receives
      const platformCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(platformCallback).toBeDefined();

      // Call platformCallback with a non-array event to trigger the else branch
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

    it("should handle undefined event in non-array fallback", () => {
      const callback = vi.fn();
      const result = adapter.onJournalCreated(callback);
      expect(result.ok).toBe(true);

      const platformCallback = mockFoundryHooksPort.getStoredCallback("createJournalEntry");
      expect(platformCallback).toBeDefined();

      // Call with undefined to trigger the else branch of isNotNullOrUndefined check
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

    it("should handle changes with flags as non-object (string/number)", () => {
      const callback = vi.fn();
      adapter.onJournalUpdated(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("updateJournalEntry");
      expect(foundryCallback).toBeDefined();

      // Call with changes that has flags as a string (not an object)
      // This tests the case where changes.flags !== undefined but typeof !== "object"
      foundryCallback!([
        { id: "journal-789" },
        { flags: "invalid flags", name: "Test" },
        {},
        "user-123",
      ]);

      // flags should be copied as-is (not normalized) because it's not an object
      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-789",
        changes: {
          flags: "invalid flags", // Copied as-is, not normalized
          name: "Test",
        },
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

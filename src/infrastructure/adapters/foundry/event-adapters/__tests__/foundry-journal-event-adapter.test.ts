import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryJournalEventAdapter } from "../foundry-journal-event-adapter";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";

describe("FoundryJournalEventAdapter", () => {
  let mockFoundryHooks: FoundryHooks;
  let adapter: FoundryJournalEventAdapter;

  beforeEach(() => {
    mockFoundryHooks = {
      on: vi.fn().mockReturnValue({ ok: true, value: 123 }),
      once: vi.fn().mockReturnValue({ ok: true, value: 124 }),
      off: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      dispose: vi.fn(),
    };

    adapter = new FoundryJournalEventAdapter(mockFoundryHooks);
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

  describe("dispose", () => {
    it("should cleanup all registrations", () => {
      adapter.onJournalCreated(vi.fn());
      adapter.onJournalUpdated(vi.fn());
      adapter.onJournalDeleted(vi.fn());

      adapter.dispose();

      expect(mockFoundryHooks.off).toHaveBeenCalledTimes(3);
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
});

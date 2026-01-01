import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FoundryJournalUiEventAdapter,
  DIFoundryJournalUiEventAdapter,
} from "../foundry-journal-ui-event-adapter";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { ok, err } from "@/domain/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { JournalDirectoryRenderedEvent } from "@/domain/ports/events/platform-journal-ui-event-port.interface";

type MockFoundryHooksPortWithGetter = FoundryHooksPort & {
  getStoredCallback: (eventType: string) => ((...args: unknown[]) => void) | undefined;
};

describe("FoundryJournalUiEventAdapter", () => {
  let mockFoundryHooksPort: MockFoundryHooksPortWithGetter;
  let adapter: FoundryJournalUiEventAdapter;
  let storedCallbacks: Map<string, (...args: unknown[]) => void>;
  let nextRegistrationId: number;

  beforeEach(() => {
    storedCallbacks = new Map<string, (...args: unknown[]) => void>();
    nextRegistrationId = 1;

    mockFoundryHooksPort = {
      registerListener: vi.fn((eventType: string, callback: (event: unknown) => void) => {
        storedCallbacks.set(eventType, callback as (...args: unknown[]) => void);
        return ok(nextRegistrationId++);
      }),
      unregisterListener: vi.fn().mockReturnValue(ok(undefined)),
      dispose: vi.fn(),
      getStoredCallback: (eventType: string) => storedCallbacks.get(eventType),
    } as unknown as MockFoundryHooksPortWithGetter;

    adapter = new FoundryJournalUiEventAdapter(mockFoundryHooksPort);
  });

  afterEach(() => {
    adapter.dispose();
    vi.clearAllMocks();
  });

  describe("onJournalDirectoryRendered", () => {
    it("should register renderJournalDirectory hook", () => {
      const callback = vi.fn();
      const result = adapter.onJournalDirectoryRendered(callback);

      expectResultOk(result);
      expect(mockFoundryHooksPort.registerListener).toHaveBeenCalledWith(
        "renderJournalDirectory",
        expect.any(Function)
      );
    });

    it("should map Foundry event to domain event with app.id", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();

      const mockApp = { id: "journal" };
      const mockHtml = document.createElement("div");
      foundryCallback!([mockApp, mockHtml]);

      expect(callback).toHaveBeenCalledWith({
        directoryId: "journal",
        timestamp: expect.any(Number),
      } as JournalDirectoryRenderedEvent);
    });

    it("should map Foundry event to domain event with app.tabName (coverage for line 209-210)", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();

      const mockApp = { tabName: "journal-tab" };
      const mockHtml = document.createElement("div");
      foundryCallback!([mockApp, mockHtml]);

      expect(callback).toHaveBeenCalledWith({
        directoryId: "journal-tab",
        timestamp: expect.any(Number),
      } as JournalDirectoryRenderedEvent);
    });

    it("should use default 'journal' when app has no id or tabName (coverage for line 214)", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();

      const mockApp = {};
      const mockHtml = document.createElement("div");
      foundryCallback!([mockApp, mockHtml]);

      expect(callback).toHaveBeenCalledWith({
        directoryId: "journal",
        timestamp: expect.any(Number),
      } as JournalDirectoryRenderedEvent);
    });

    it("should skip when directoryId cannot be extracted", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();

      // Pass null as app to trigger skip
      foundryCallback!([null, document.createElement("div")]);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should skip when HTML element cannot be extracted (coverage for line 219)", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();

      const mockApp = { id: "journal" };
      // Pass null as html to trigger skip
      foundryCallback!([mockApp, null]);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle HTML as array (coverage for getFirstElementIfArray path)", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();

      const mockApp = { id: "journal" };
      const mockHtml = document.createElement("div");
      // Pass array with HTML element
      foundryCallback!([mockApp, [mockHtml]]);

      expect(callback).toHaveBeenCalledWith({
        directoryId: "journal",
        timestamp: expect.any(Number),
      } as JournalDirectoryRenderedEvent);
    });

    it("should handle non-object app in extractDirectoryId (coverage for line 205 else path)", () => {
      const callback = vi.fn();
      adapter.onJournalDirectoryRendered(callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("renderJournalDirectory");
      expect(foundryCallback).toBeDefined();

      // Pass a non-object (string) as app - should default to "journal"
      const mockHtml = document.createElement("div");
      foundryCallback!(["not-an-object", mockHtml]);

      // Should use default "journal" directoryId
      expect(callback).toHaveBeenCalledWith({
        directoryId: "journal",
        timestamp: expect.any(Number),
      } as JournalDirectoryRenderedEvent);
    });
  });

  describe("registerListener", () => {
    it("should register generic listener and call toJournalUiEvent (coverage for line 95)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("customEvent", callback);

      expectResultOk(result);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("customEvent");
      expect(foundryCallback).toBeDefined();

      // Test with JournalDirectoryRenderedEvent-like object
      const eventObject = {
        directoryId: "test-directory",
        timestamp: Date.now(),
      };
      foundryCallback!([eventObject]);

      expect(callback).toHaveBeenCalledWith({
        directoryId: "test-directory",
        timestamp: expect.any(Number),
      });
    });

    it("should handle JournalContextMenuEvent-like object in registerListener", () => {
      const callback = vi.fn();
      adapter.registerListener("customEvent", callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("customEvent");
      expect(foundryCallback).toBeDefined();

      const eventObject = {
        journalId: "journal-123",
        options: [{ name: "Test", icon: "<i></i>", callback: vi.fn() }],
        timestamp: Date.now(),
      };
      foundryCallback!([eventObject]);

      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-123",
        options: expect.any(Array),
        timestamp: expect.any(Number),
      });
    });

    it("should skip when event object cannot be converted", () => {
      const callback = vi.fn();
      adapter.registerListener("customEvent", callback);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("customEvent");
      expect(foundryCallback).toBeDefined();

      // Pass non-object
      foundryCallback!([null]);
      foundryCallback!(["string"]);
      foundryCallback!([]);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("registerFoundryHook - event handling", () => {
    it("should handle non-array event (coverage for lines 177-181)", () => {
      // Use registerListener which accepts any callback
      const callback = vi.fn();
      const result = adapter.registerListener("testEvent", callback);

      expectResultOk(result);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("testEvent");
      expect(foundryCallback).toBeDefined();

      // The platformCallback receives event as unknown
      // When it's not an array, it goes to the else branch (lines 177-181)
      // Pass a single object that can be converted to JournalUiEvent (has directoryId)
      const testObject = { directoryId: "journal", timestamp: Date.now() };
      foundryCallback!(testObject);

      // The callback should be called with the converted JournalUiEvent
      expect(callback).toHaveBeenCalledWith({
        directoryId: "journal",
        timestamp: expect.any(Number),
      });
    });

    it("should handle registerListener failure (coverage for line 188)", () => {
      const mockError = {
        code: "EVENT_REGISTRATION_FAILED" as const,
        message: "Registration failed",
      };
      vi.mocked(mockFoundryHooksPort.registerListener).mockReturnValueOnce(err(mockError));

      const callback = vi.fn();
      const result = adapter.onJournalDirectoryRendered(callback);

      expectResultErr(result);
      expect(result.error.code).toBe("EVENT_REGISTRATION_FAILED");
    });

    it("should handle non-object event (coverage for toJournalUiEvent null return)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("testEvent", callback);

      expectResultOk(result);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("testEvent");
      expect(foundryCallback).toBeDefined();

      // Pass non-object (string) - should not call callback
      foundryCallback!("string");

      // Callback should not be called because toJournalUiEvent returns null
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle event that doesn't match any JournalUiEvent type (coverage for toJournalUiEvent null return)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("testEvent", callback);

      expectResultOk(result);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("testEvent");
      expect(foundryCallback).toBeDefined();

      // Pass object that doesn't have directoryId or journalId/options
      const testObject = { someProperty: "value" };
      foundryCallback!(testObject);

      // Callback should not be called because toJournalUiEvent returns null
      expect(callback).not.toHaveBeenCalled();
    });

    it("should use Date.now() fallback when timestamp is not a number in JournalDirectoryRenderedEvent (coverage for line 106)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("testEvent", callback);

      expectResultOk(result);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("testEvent");
      expect(foundryCallback).toBeDefined();

      // Pass event object with directoryId but invalid timestamp
      const eventObject = {
        directoryId: "test-directory",
        timestamp: "not-a-number", // Invalid timestamp
      };
      foundryCallback!([eventObject]);

      // Callback should be called with Date.now() as fallback timestamp
      expect(callback).toHaveBeenCalledWith({
        directoryId: "test-directory",
        timestamp: expect.any(Number),
      });
      // Verify timestamp is recent (within last second)
      const firstCall = callback.mock.calls[0];
      expect(firstCall).toBeDefined();
      const calledTimestamp = (firstCall![0] as { timestamp: number }).timestamp;
      expect(calledTimestamp).toBeGreaterThan(Date.now() - 1000);
      expect(calledTimestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should use Date.now() fallback when timestamp is not a number in JournalContextMenuEvent (coverage for line 121)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("testEvent", callback);

      expectResultOk(result);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("testEvent");
      expect(foundryCallback).toBeDefined();

      // Pass event object with journalId and options but invalid timestamp
      const eventObject = {
        journalId: "journal-123",
        options: [{ name: "Test", icon: "<i></i>", callback: vi.fn() }],
        timestamp: null, // Invalid timestamp
      };
      foundryCallback!([eventObject]);

      // Callback should be called with Date.now() as fallback timestamp
      expect(callback).toHaveBeenCalledWith({
        journalId: "journal-123",
        options: expect.any(Array),
        timestamp: expect.any(Number),
      });
      // Verify timestamp is recent (within last second)
      const firstCall = callback.mock.calls[0];
      expect(firstCall).toBeDefined();
      const calledTimestamp = (firstCall![0] as { timestamp: number }).timestamp;
      expect(calledTimestamp).toBeGreaterThan(Date.now() - 1000);
      expect(calledTimestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should handle null/undefined event in registerFoundryHook (coverage for line 180 else path)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("testEvent", callback);

      expectResultOk(result);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("testEvent");
      expect(foundryCallback).toBeDefined();

      // Pass null directly - this will trigger the else path where isNotNullOrUndefined returns false
      foundryCallback!(null);

      // Callback should not be called because the event is null
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle undefined event in registerFoundryHook (coverage for line 180 else path)", () => {
      const callback = vi.fn();
      const result = adapter.registerListener("testEvent", callback);

      expectResultOk(result);

      const foundryCallback = mockFoundryHooksPort.getStoredCallback("testEvent");
      expect(foundryCallback).toBeDefined();

      // Pass undefined directly - this will trigger the else path where isNotNullOrUndefined returns false
      foundryCallback!(undefined);

      // Callback should not be called because the event is undefined
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("unregisterListener", () => {
    it("should unregister listener successfully", () => {
      const callback = vi.fn();
      const registerResult = adapter.onJournalDirectoryRendered(callback);
      expectResultOk(registerResult);

      const unregisterResult = adapter.unregisterListener(registerResult.value);
      expectResultOk(unregisterResult);
      expect(mockFoundryHooksPort.unregisterListener).toHaveBeenCalledWith(registerResult.value);
    });

    it("should return error when registration ID not found", () => {
      const result = adapter.unregisterListener(999);

      expectResultErr(result);
      expect(result.error.code).toBe("EVENT_UNREGISTRATION_FAILED");
      expect(result.error.message).toContain("No registration found");
    });
  });

  describe("dispose", () => {
    it("should cleanup all registered listeners", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const result1 = adapter.onJournalDirectoryRendered(callback1);
      const result2 = adapter.onJournalDirectoryRendered(callback2);
      expectResultOk(result1);
      expectResultOk(result2);

      adapter.dispose();

      // Verify unregisterListener was called for both
      expect(mockFoundryHooksPort.unregisterListener).toHaveBeenCalledTimes(2);
    });
  });

  describe("DIFoundryJournalUiEventAdapter", () => {
    it("should extend FoundryJournalUiEventAdapter", () => {
      const diAdapter = new DIFoundryJournalUiEventAdapter(mockFoundryHooksPort);
      expect(diAdapter).toBeInstanceOf(FoundryJournalUiEventAdapter);
    });

    it("should have correct dependencies", () => {
      expect(DIFoundryJournalUiEventAdapter.dependencies).toBeDefined();
      expect(DIFoundryJournalUiEventAdapter.dependencies.length).toBe(1);
    });
  });
});

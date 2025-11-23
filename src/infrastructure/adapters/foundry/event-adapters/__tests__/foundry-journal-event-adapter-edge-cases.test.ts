import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryJournalEventAdapter } from "../foundry-journal-event-adapter";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";

describe("FoundryJournalEventAdapter - Edge Cases", () => {
  let mockFoundryHooks: FoundryHooksPort;
  let mockLibWrapper: {
    register: ReturnType<typeof vi.fn>;
    unregister: ReturnType<typeof vi.fn>;
    callOriginal: ReturnType<typeof vi.fn>;
  };
  let originalLibWrapper: typeof globalThis.libWrapper;
  let adapter: FoundryJournalEventAdapter;

  beforeEach(() => {
    mockFoundryHooks = {
      on: vi.fn().mockReturnValue({ ok: true, value: 123 }),
      once: vi.fn().mockReturnValue({ ok: true, value: 124 }),
      off: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      dispose: vi.fn(),
      registerListener: vi.fn().mockReturnValue({ ok: true, value: 123 }),
      unregisterListener: vi.fn().mockReturnValue({ ok: true, value: undefined }),
    } as unknown as FoundryHooksPort;

    // Mock libWrapper
    mockLibWrapper = {
      register: vi.fn(),
      unregister: vi.fn(),
      callOriginal: vi.fn((_instance, _method, ..._args) => {
        return undefined;
      }),
    };
    originalLibWrapper = globalThis.libWrapper;
    // @ts-expect-error - libWrapper is a global that may not exist
    globalThis.libWrapper = mockLibWrapper;

    // Mock ContextMenu via foundry.applications.ux.ContextMenu.implementation
    const mockContextMenuClass = class MockContextMenu {
      menuItems: Array<{ name: string; icon: string; callback: () => void }> = [];
      constructor() {}
    };

    // Mock foundry?.applications?.ux?.ContextMenu
    const _originalFoundry = globalThis.foundry;
    if (!globalThis.foundry) {
      // @ts-expect-error - foundry is a global that may not exist
      globalThis.foundry = {};
    }
    if (!globalThis.foundry.applications) {
      // @ts-expect-error - foundry is a global that may not exist
      globalThis.foundry.applications = {};
    }
    if (!globalThis.foundry.applications.ux) {
      // @ts-expect-error - foundry is a global that may not exist
      globalThis.foundry.applications.ux = {};
    }
    // @ts-expect-error - foundry is a global that may not exist

    globalThis.foundry.applications.ux.ContextMenu = { implementation: mockContextMenuClass };
    void _originalFoundry; // Suppress unused variable warning

    adapter = new FoundryJournalEventAdapter(mockFoundryHooks);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Restore original globals
    if (originalLibWrapper !== undefined) {
      globalThis.libWrapper = originalLibWrapper;
    } else {
      // @ts-expect-error - libWrapper is a global that may not exist
      delete globalThis.libWrapper;
    }
  });

  describe("onJournalContextMenu - libWrapper undefined during registration", () => {
    it("should throw error if libWrapper becomes undefined during registration (coverage for line 221)", () => {
      // This test covers the unreachable code path on line 219-221
      // We need to simulate libWrapper being available on line 134 check,
      // but undefined when accessed on line 218 within the tryCatch block

      const callback = vi.fn();

      // Store original libWrapper value
      const originalLibWrapperValue = globalThis.libWrapper;

      // Track how many times libWrapper is accessed
      let accessCount = 0;

      // Delete libWrapper first
      // @ts-expect-error - libWrapper is a global that may not exist
      delete globalThis.libWrapper;

      // Create a getter that returns mockLibWrapper for the first access (line 134),
      // but undefined for the second access (line 218)
      Object.defineProperty(globalThis, "libWrapper", {
        get() {
          accessCount++;
          // First access (line 134): typeof globalThis.libWrapper === "undefined"
          //   - typeof check accesses the getter, returns mockLibWrapper
          //   - typeof returns "object", check passes
          if (accessCount === 1) {
            return mockLibWrapper;
          }
          // Second access (line 218): const libWrapperInstance = globalThis.libWrapper
          //   - Return undefined here to trigger line 219 check and throw on line 221
          return undefined;
        },
        configurable: true,
        enumerable: true,
      });

      // Call onJournalContextMenu
      // Expected flow:
      // 1. Line 134: typeof globalThis.libWrapper === "undefined"
      //    -> Getter called (accessCount = 1), returns mockLibWrapper
      //    -> typeof returns "object", check fails (not "undefined"), continues
      // 2. Line 147: ContextMenu check passes
      // 3. Line 158: callback.push(callback)
      // 4. Line 162: !this.libWrapperRegistered is true, enter block
      // 5. Line 165: tryCatch starts
      // 6. Line 218: const libWrapperInstance = globalThis.libWrapper
      //    -> Getter called (accessCount = 2), returns undefined
      // 7. Line 219: typeof libWrapperInstance === "undefined" -> true
      // 8. Line 221: throw new Error("libWrapper is not available")
      // 9. Error caught by tryCatch (line 205), wrapped in result
      const result = adapter.onJournalContextMenu(callback);

      // Debug: Check access count
      console.log("libWrapper access count:", accessCount);

      // The error from line 221 should be caught by tryCatch
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.message).toContain("libWrapper is not available");
      }

      // Verify that callback was rolled back (line 213 should execute)
      expect(
        (adapter as unknown as { contextMenuCallbacks: unknown[] }).contextMenuCallbacks
      ).not.toContain(callback);

      // Cleanup: restore original libWrapper
      // @ts-expect-error - libWrapper is a global that may not exist
      delete globalThis.libWrapper;
      if (originalLibWrapperValue !== undefined) {
        globalThis.libWrapper = originalLibWrapperValue;
      }
    });
  });
});

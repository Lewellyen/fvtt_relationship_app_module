import { describe, it, expect, vi } from "vitest";
import type { PlatformJournalEventPort } from "../platform-journal-event-port.interface";

describe("JournalEventPort (Contract Test)", () => {
  it("should define all required methods", () => {
    const mockPort: PlatformJournalEventPort = {
      onJournalCreated: vi.fn(),
      onJournalUpdated: vi.fn(),
      onJournalDeleted: vi.fn(),
      onJournalDirectoryRendered: vi.fn(),
      registerListener: vi.fn(),
      unregisterListener: vi.fn(),
    };

    expect(mockPort.onJournalCreated).toBeDefined();
    expect(mockPort.onJournalUpdated).toBeDefined();
    expect(mockPort.onJournalDeleted).toBeDefined();
    expect(mockPort.onJournalDirectoryRendered).toBeDefined();
    expect(mockPort.registerListener).toBeDefined();
    expect(mockPort.unregisterListener).toBeDefined();
  });

  it("should have the correct method signatures", () => {
    const mockPort: PlatformJournalEventPort = {
      onJournalCreated: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      onJournalUpdated: vi.fn().mockReturnValue({ ok: true, value: "2" }),
      onJournalDeleted: vi.fn().mockReturnValue({ ok: true, value: "3" }),
      onJournalDirectoryRendered: vi.fn().mockReturnValue({ ok: true, value: "4" }),
      registerListener: vi.fn().mockReturnValue({ ok: true, value: "6" }),
      unregisterListener: vi.fn().mockReturnValue({ ok: true, value: undefined }),
    };

    // Test that methods can be called with correct arguments
    const createdCallback = vi.fn();
    mockPort.onJournalCreated(createdCallback);
    expect(mockPort.onJournalCreated).toHaveBeenCalledWith(createdCallback);

    const updatedCallback = vi.fn();
    mockPort.onJournalUpdated(updatedCallback);
    expect(mockPort.onJournalUpdated).toHaveBeenCalledWith(updatedCallback);

    const deletedCallback = vi.fn();
    mockPort.onJournalDeleted(deletedCallback);
    expect(mockPort.onJournalDeleted).toHaveBeenCalledWith(deletedCallback);

    const renderedCallback = vi.fn();
    mockPort.onJournalDirectoryRendered(renderedCallback);
    expect(mockPort.onJournalDirectoryRendered).toHaveBeenCalledWith(renderedCallback);

    mockPort.unregisterListener("1");
    expect(mockPort.unregisterListener).toHaveBeenCalledWith("1");
  });
});

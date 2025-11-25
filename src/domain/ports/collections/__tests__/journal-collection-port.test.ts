import { describe, it, expect, vi } from "vitest";
import type { JournalCollectionPort } from "../journal-collection-port.interface";

describe("JournalCollectionPort (Contract Test)", () => {
  it("should define all required methods", () => {
    const mockPort: JournalCollectionPort = {
      getAll: vi.fn(),
      getById: vi.fn(),
      getByIds: vi.fn(),
      exists: vi.fn(),
      count: vi.fn(),
      search: vi.fn(),
      query: vi.fn(),
    };

    expect(mockPort.getAll).toBeDefined();
    expect(mockPort.getById).toBeDefined();
    expect(mockPort.getByIds).toBeDefined();
    expect(mockPort.exists).toBeDefined();
    expect(mockPort.count).toBeDefined();
    expect(mockPort.search).toBeDefined();
    expect(mockPort.query).toBeDefined();
  });
});

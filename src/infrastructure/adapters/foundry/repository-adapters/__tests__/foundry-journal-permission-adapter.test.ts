import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryJournalPermissionAdapter } from "../foundry-journal-permission-adapter";

describe("FoundryJournalPermissionAdapter", () => {
  let adapter: FoundryJournalPermissionAdapter;
  let mockJournal: {
    testUserPermission: (user: unknown, permission: string) => boolean;
    id: string;
  };

  beforeEach(() => {
    adapter = new FoundryJournalPermissionAdapter();

    mockJournal = {
      id: "journal-123",
      testUserPermission: vi.fn(),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("canUserViewJournal", () => {
    it("should return true if game is not available (fail-open)", () => {
      vi.stubGlobal("game", undefined);

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return true if game.journal is not available (fail-open)", () => {
      vi.stubGlobal("game", {
        journal: undefined,
        user: { id: "user-1", name: "Test User" },
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return true if game.user is not available (fail-open)", () => {
      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(),
        },
        user: null,
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return false if journal is not found", () => {
      const mockUser = { id: "user-1", name: "Test User" };
      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => undefined),
        },
        user: mockUser,
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("should return true if user has OBSERVER permission", () => {
      const mockUser = { id: "user-1", name: "Test User" };
      mockJournal.testUserPermission = vi.fn(() => true);

      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => mockJournal),
        },
        user: mockUser,
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(mockJournal.testUserPermission).toHaveBeenCalledWith(mockUser, "OBSERVER");
    });

    it("should return false if user does not have OBSERVER permission", () => {
      const mockUser = { id: "user-1", name: "Test User" };
      mockJournal.testUserPermission = vi.fn(() => false);

      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => mockJournal),
        },
        user: mockUser,
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
      expect(mockJournal.testUserPermission).toHaveBeenCalledWith(mockUser, "OBSERVER");
    });

    it("should return true if testUserPermission throws Error (fail-open)", () => {
      const mockUser = { id: "user-1", name: "Test User" };
      mockJournal.testUserPermission = vi.fn(() => {
        throw new Error("Permission check failed");
      });

      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => mockJournal),
        },
        user: mockUser,
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return true if testUserPermission throws non-Error object (fail-open)", () => {
      const mockUser = { id: "user-1", name: "Test User" };
      mockJournal.testUserPermission = vi.fn(() => {
        throw "String error"; // Non-Error object to test String(error) branch
      });

      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => mockJournal),
        },
        user: mockUser,
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return false if journal.get throws Error", () => {
      const mockUser = { id: "user-1", name: "Test User" };

      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => {
            throw new Error("Journal get failed");
          }),
        },
        user: mockUser,
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false); // Journal not found -> no permission
      }
    });

    it("should return false if journal.get throws non-Error object", () => {
      const mockUser = { id: "user-1", name: "Test User" };

      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => {
            throw "String error"; // Non-Error object to test String(error) branch
          }),
        },
        user: mockUser,
      });

      const result = adapter.canUserViewJournal("journal-123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false); // Journal not found -> no permission
      }
    });

    it("should handle different journal IDs", () => {
      const mockUser = { id: "user-1", name: "Test User" };
      const mockJournal2 = {
        id: "journal-456",
        testUserPermission: vi.fn(() => true),
      };

      mockJournal.testUserPermission = vi.fn(() => true);

      vi.stubGlobal("game", {
        journal: {
          get: vi.fn((id: string) => {
            if (id === "journal-123") return mockJournal;
            if (id === "journal-456") return mockJournal2;
            return undefined;
          }),
        },
        user: mockUser,
      });

      const result1 = adapter.canUserViewJournal("journal-123");
      const result2 = adapter.canUserViewJournal("journal-456");

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value).toBe(true);
        expect(result2.value).toBe(true);
      }
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { DefaultJournalMapper } from "../default-journal-mapper";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";

describe("DefaultJournalMapper", () => {
  let mapper: DefaultJournalMapper;

  beforeEach(() => {
    mapper = new DefaultJournalMapper();
  });

  describe("supports", () => {
    it("should support objects with string id", () => {
      const entity = { id: "test", name: "Test" };
      expect(mapper.supports(entity)).toBe(true);
    });

    it("should not support objects without id", () => {
      const entity = { name: "Test" };
      expect(mapper.supports(entity)).toBe(false);
    });

    it("should not support objects with non-string id", () => {
      const entity = { id: 123, name: "Test" };
      expect(mapper.supports(entity)).toBe(false);
    });

    it("should not support null", () => {
      expect(mapper.supports(null)).toBe(false);
    });

    it("should not support primitives", () => {
      expect(mapper.supports("string")).toBe(false);
      expect(mapper.supports(123)).toBe(false);
      expect(mapper.supports(true)).toBe(false);
    });
  });

  describe("toDomain", () => {
    it("should map id and name", () => {
      const entity = { id: "test", name: "Test" } as FoundryJournalEntry;
      const result = mapper.toDomain(entity);
      expect(result).toEqual({ id: "test", name: "Test" });
    });

    it("should convert undefined name to null", () => {
      const entity = { id: "test", name: undefined } as unknown as FoundryJournalEntry;
      const result = mapper.toDomain(entity);
      expect(result).toEqual({ id: "test", name: null });
    });

    it("should handle null name", () => {
      const entity = { id: "test", name: null } as unknown as FoundryJournalEntry;
      const result = mapper.toDomain(entity);
      expect(result).toEqual({ id: "test", name: null });
    });
  });
});

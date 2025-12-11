import { describe, it, expect, beforeEach } from "vitest";
import { JournalTypeMapper, type IJournalTypeMapper } from "../journal-type-mapper";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";

describe("JournalTypeMapper", () => {
  let mapper: IJournalTypeMapper;

  beforeEach(() => {
    mapper = new JournalTypeMapper();
  });

  describe("mapFoundryToDomain", () => {
    it("should map Foundry journal entry to domain journal entry", () => {
      const foundryEntry: FoundryJournalEntry = {
        id: "journal-1",
        name: "Test Journal",
      } as FoundryJournalEntry;

      const result = mapper.mapFoundryToDomain(foundryEntry);

      expect(result).toEqual({
        id: "journal-1",
        name: "Test Journal",
      });
    });

    it("should convert undefined name to null", () => {
      const foundryEntry = {
        id: "journal-1",
        name: undefined,
      } as any as FoundryJournalEntry;

      const result = mapper.mapFoundryToDomain(foundryEntry);

      expect(result).toEqual({
        id: "journal-1",
        name: null,
      });
    });

    it("should handle null name", () => {
      const foundryEntry = {
        id: "journal-1",
        name: null,
      } as any as FoundryJournalEntry;

      const result = mapper.mapFoundryToDomain(foundryEntry);

      expect(result).toEqual({
        id: "journal-1",
        name: null,
      });
    });

    it("should handle empty string name", () => {
      const foundryEntry: FoundryJournalEntry = {
        id: "journal-1",
        name: "",
      } as FoundryJournalEntry;

      const result = mapper.mapFoundryToDomain(foundryEntry);

      expect(result).toEqual({
        id: "journal-1",
        name: "",
      });
    });
  });

  describe("mapDomainToFoundry", () => {
    it("should map domain journal entry to Foundry journal entry structure", () => {
      const domainEntry: JournalEntry = {
        id: "journal-1",
        name: "Test Journal",
      };

      const result = mapper.mapDomainToFoundry(domainEntry);

      expect(result).toEqual({
        id: "journal-1",
        name: "Test Journal",
      });
    });

    it("should omit name property when null", () => {
      const domainEntry: JournalEntry = {
        id: "journal-1",
        name: null,
      };

      const result = mapper.mapDomainToFoundry(domainEntry);

      expect(result).toEqual({
        id: "journal-1",
      });
      expect(result.name).toBeUndefined();
    });

    it("should handle empty string name", () => {
      const domainEntry: JournalEntry = {
        id: "journal-1",
        name: "",
      };

      const result = mapper.mapDomainToFoundry(domainEntry);

      expect(result).toEqual({
        id: "journal-1",
        name: "",
      });
    });
  });
});

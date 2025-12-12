import { describe, it, expect, beforeEach } from "vitest";
import { JournalMapperRegistry } from "../journal-mapper-registry";
import { DefaultJournalMapper } from "../default-journal-mapper";
import type { JournalMapper } from "../journal-mapper.interface";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";

describe("JournalMapperRegistry", () => {
  let registry: JournalMapperRegistry;
  let defaultMapper: DefaultJournalMapper;

  beforeEach(() => {
    registry = new JournalMapperRegistry();
    defaultMapper = new DefaultJournalMapper();
  });

  describe("register", () => {
    it("should register a mapper", () => {
      registry.register(defaultMapper);
      expect(registry.getAll()).toHaveLength(1);
      expect(registry.getAll()[0]).toBe(defaultMapper);
    });

    it("should throw error if mapper is already registered", () => {
      registry.register(defaultMapper);
      expect(() => registry.register(defaultMapper)).toThrow("Mapper is already registered");
    });

    it("should maintain registration order", () => {
      const mapper1 = new DefaultJournalMapper();
      const mapper2 = new DefaultJournalMapper();
      registry.register(mapper1);
      registry.register(mapper2);

      const all = registry.getAll();
      expect(all[0]).toBe(mapper1);
      expect(all[1]).toBe(mapper2);
    });
  });

  describe("unregister", () => {
    it("should unregister a mapper", () => {
      registry.register(defaultMapper);
      registry.unregister(defaultMapper);
      expect(registry.getAll()).toHaveLength(0);
    });

    it("should not throw if mapper is not registered", () => {
      expect(() => registry.unregister(defaultMapper)).not.toThrow();
    });
  });

  describe("getAll", () => {
    it("should return empty array initially", () => {
      expect(registry.getAll()).toEqual([]);
    });

    it("should return copy of mappers array", () => {
      registry.register(defaultMapper);
      const all1 = registry.getAll();
      const all2 = registry.getAll();
      expect(all1).not.toBe(all2); // Different array instances
      expect(all1).toEqual(all2); // Same content
    });
  });

  describe("findMapper", () => {
    it("should return undefined if no mapper supports entity", () => {
      const entity = { id: "test" };
      expect(registry.findMapper(entity)).toBeUndefined();
    });

    it("should return first matching mapper", () => {
      registry.register(defaultMapper);
      const entity = { id: "test", name: "Test" } as FoundryJournalEntry;
      const found = registry.findMapper(entity);
      expect(found).toBe(defaultMapper);
    });

    it("should return first matching mapper in registration order", () => {
      const mapper1 = new DefaultJournalMapper();
      const mapper2 = new DefaultJournalMapper();
      registry.register(mapper1);
      registry.register(mapper2);

      const entity = { id: "test", name: "Test" } as FoundryJournalEntry;
      const found = registry.findMapper(entity);
      expect(found).toBe(mapper1); // First registered
    });
  });

  describe("mapToDomain", () => {
    it("should map entity using registered mapper", () => {
      registry.register(defaultMapper);
      const entity = { id: "test", name: "Test" } as FoundryJournalEntry;
      const result = registry.mapToDomain(entity);
      expect(result).toEqual({ id: "test", name: "Test" });
    });

    it("should convert undefined name to null", () => {
      registry.register(defaultMapper);
      const entity = { id: "test", name: undefined } as unknown as FoundryJournalEntry;
      const result = registry.mapToDomain(entity);
      expect(result).toEqual({ id: "test", name: null });
    });

    it("should throw error if no mapper supports entity", () => {
      const entity = { invalid: "data" };
      expect(() => registry.mapToDomain(entity)).toThrow("No mapper found");
    });

    it("should throw error if mapper supports() returns false after findMapper()", () => {
      // Create a mapper that returns true in findMapper() but false in the second supports() check
      // This tests the defensive check in mapToDomain() line 86-90
      let callCount = 0;
      const unstableMapper: JournalMapper = {
        supports: (entity: unknown): entity is FoundryJournalEntry => {
          callCount++;
          // First call (in findMapper) returns true, second call (in mapToDomain check) returns false
          return callCount === 1 && typeof entity === "object" && entity !== null && "id" in entity;
        },
        toDomain: (entity: FoundryJournalEntry) => ({
          id: entity.id,
          name: entity.name ?? null,
        }),
      };

      registry.register(unstableMapper);
      const entity = { id: "test", name: "Test" } as FoundryJournalEntry;

      // This should trigger the edge case where findMapper() finds the mapper
      // but the second supports() check in mapToDomain() returns false
      expect(() => registry.mapToDomain(entity)).toThrow("Mapper supports() returned false");
    });
  });

  describe("validateNoOverlaps", () => {
    it("should return empty array if no conflicts", () => {
      registry.register(defaultMapper);
      const conflicts = registry.validateNoOverlaps([
        { id: "test1", name: "Test 1" },
        { id: "test2", name: "Test 2" },
      ]);
      expect(conflicts).toEqual([]);
    });

    it("should detect conflicts when multiple mappers support same entity", () => {
      // Create a custom mapper that also supports the same entities
      const customMapper: JournalMapper = {
        supports: (entity: unknown): entity is FoundryJournalEntry => {
          return (
            typeof entity === "object" &&
            entity !== null &&
            "id" in entity &&
            typeof (entity as { id: unknown }).id === "string"
          );
        },
        toDomain: (entity: FoundryJournalEntry) => ({
          id: entity.id,
          name: entity.name ?? null,
        }),
      };

      registry.register(customMapper);
      registry.register(defaultMapper);

      const conflicts = registry.validateNoOverlaps([
        { id: "test", name: "Test" } as FoundryJournalEntry,
      ]);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]?.mappers).toHaveLength(2);
    });
  });
});

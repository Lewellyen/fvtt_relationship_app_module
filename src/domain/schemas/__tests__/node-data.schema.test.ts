/**
 * Tests for RelationshipNodeData Valibot schema.
 */

import { describe, it, expect } from "vitest";
import {
  relationshipNodeDataSchema,
  parseRelationshipNodeData,
  safeParseRelationshipNodeData,
} from "../node-data.schema";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";
import * as v from "valibot";

describe("node-data.schema", () => {
  describe("relationshipNodeDataSchema", () => {
    const validNodeData = {
      schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
      nodeKey: "JournalEntry.page-abc123",
      name: "Test Node",
      kind: "person",
      relation: "friend",
      descriptions: {
        public: "Public description",
        hidden: "Hidden description",
        gm: "GM description",
      },
      reveal: {
        public: true,
        hidden: false,
      },
    };

    it("should validate valid node data", () => {
      const result = v.safeParse(relationshipNodeDataSchema, validNodeData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.schemaVersion).toBe(RELATIONSHIP_NODE_SCHEMA_VERSION);
        expect(result.output.name).toBe("Test Node");
        expect(result.output.kind).toBe("person");
      }
    });

    it("should validate node data with optional fields", () => {
      const dataWithOptionals = {
        ...validNodeData,
        factionId: "faction-123",
        icon: "icons/svg/sword.svg",
        effects: {
          friend: "Friendly effect",
          enemy: "Enemy effect",
        },
        linkedEntityUuid: "Actor.abc123",
      };

      const result = v.safeParse(relationshipNodeDataSchema, dataWithOptionals);
      expect(result.success).toBe(true);
    });

    it("should reject invalid schema version", () => {
      const invalidData = {
        ...validNodeData,
        schemaVersion: 999,
      };

      const result = v.safeParse(relationshipNodeDataSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
        // missing nodeKey, name, kind, relation, descriptions, reveal
      };

      const result = v.safeParse(relationshipNodeDataSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid kind", () => {
      const invalidData = {
        ...validNodeData,
        kind: "invalid",
      };

      const result = v.safeParse(relationshipNodeDataSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid relation", () => {
      const invalidData = {
        ...validNodeData,
        relation: "invalid",
      };

      const result = v.safeParse(relationshipNodeDataSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("parseRelationshipNodeData", () => {
    const validNodeData = {
      schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
      nodeKey: "JournalEntry.page-abc123",
      name: "Test Node",
      kind: "person",
      relation: "friend",
      descriptions: {},
      reveal: {
        public: true,
        hidden: false,
      },
    };

    it("should parse valid node data", () => {
      const result = parseRelationshipNodeData(validNodeData);
      expect(result.schemaVersion).toBe(RELATIONSHIP_NODE_SCHEMA_VERSION);
      expect(result.name).toBe("Test Node");
    });

    it("should throw on invalid data", () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
        // missing required fields
      };

      expect(() => parseRelationshipNodeData(invalidData)).toThrow();
    });
  });

  describe("safeParseRelationshipNodeData", () => {
    const validNodeData = {
      schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
      nodeKey: "JournalEntry.page-abc123",
      name: "Test Node",
      kind: "person",
      relation: "friend",
      descriptions: {},
      reveal: {
        public: true,
        hidden: false,
      },
    };

    it("should return success for valid data", () => {
      const result = safeParseRelationshipNodeData(validNodeData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.name).toBe("Test Node");
      }
    });

    it("should return failure for invalid data", () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
        // missing required fields
      };

      const result = safeParseRelationshipNodeData(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

/**
 * Tests for RelationshipGraphData Valibot schema.
 */

import { describe, it, expect } from "vitest";
import {
  relationshipGraphDataSchema,
  parseRelationshipGraphData,
  safeParseRelationshipGraphData,
} from "../graph-data.schema";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";
import * as v from "valibot";

describe("graph-data.schema", () => {
  describe("relationshipGraphDataSchema", () => {
    const validGraphData = {
      schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
      graphKey: "JournalEntry.page-xyz789",
      nodeKeys: ["node-1", "node-2"],
      edges: [
        {
          id: "edge-1",
          source: "node-1",
          target: "node-2",
          knowledge: "public",
        },
      ],
    };

    it("should validate valid graph data", () => {
      const result = v.safeParse(relationshipGraphDataSchema, validGraphData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.schemaVersion).toBe(RELATIONSHIP_GRAPH_SCHEMA_VERSION);
        expect(result.output.nodeKeys).toHaveLength(2);
        expect(result.output.edges).toHaveLength(1);
      }
    });

    it("should validate graph data with layout", () => {
      const dataWithLayout = {
        ...validGraphData,
        layout: {
          positions: {
            node1: { x: 100, y: 200 },
            node2: { x: 300, y: 400 },
          },
          zoom: 1.5,
          pan: { x: 10, y: 20 },
        },
      };

      const result = v.safeParse(relationshipGraphDataSchema, dataWithLayout);
      expect(result.success).toBe(true);
    });

    it("should validate graph data with edge labels", () => {
      const dataWithLabels = {
        ...validGraphData,
        edges: [
          {
            id: "edge-1",
            source: "node-1",
            target: "node-2",
            knowledge: "hidden",
            label: "Secret relationship",
          },
        ],
      };

      const result = v.safeParse(relationshipGraphDataSchema, dataWithLabels);
      expect(result.success).toBe(true);
    });

    it("should validate graph data with lastVersion", () => {
      const dataWithLastVersion = {
        ...validGraphData,
        lastVersion: {
          schemaVersion: 0,
        },
      };

      const result = v.safeParse(relationshipGraphDataSchema, dataWithLastVersion);
      expect(result.success).toBe(true);
    });

    it("should reject invalid schema version", () => {
      const invalidData = {
        ...validGraphData,
        schemaVersion: 999,
      };

      const result = v.safeParse(relationshipGraphDataSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
        // missing graphKey, nodeKeys, edges
      };

      const result = v.safeParse(relationshipGraphDataSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid knowledge type", () => {
      const invalidData = {
        ...validGraphData,
        edges: [
          {
            id: "edge-1",
            source: "node-1",
            target: "node-2",
            knowledge: "invalid",
          },
        ],
      };

      const result = v.safeParse(relationshipGraphDataSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("parseRelationshipGraphData", () => {
    const validGraphData = {
      schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
      graphKey: "JournalEntry.page-xyz789",
      nodeKeys: ["node-1"],
      edges: [],
    };

    it("should parse valid graph data", () => {
      const result = parseRelationshipGraphData(validGraphData);
      expect(result.schemaVersion).toBe(RELATIONSHIP_GRAPH_SCHEMA_VERSION);
      expect(result.graphKey).toBe("JournalEntry.page-xyz789");
    });

    it("should throw on invalid data", () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
        // missing required fields
      };

      expect(() => parseRelationshipGraphData(invalidData)).toThrow();
    });
  });

  describe("safeParseRelationshipGraphData", () => {
    const validGraphData = {
      schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
      graphKey: "JournalEntry.page-xyz789",
      nodeKeys: ["node-1"],
      edges: [],
    };

    it("should return success for valid data", () => {
      const result = safeParseRelationshipGraphData(validGraphData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.graphKey).toBe("JournalEntry.page-xyz789");
      }
    });

    it("should return failure for invalid data", () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
        // missing required fields
      };

      const result = safeParseRelationshipGraphData(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

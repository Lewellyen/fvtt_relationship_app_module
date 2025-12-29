import { describe, it, expect, beforeEach } from "vitest";
import { BatchUpdateContextService } from "../BatchUpdateContextService";

describe("BatchUpdateContextService", () => {
  let service: BatchUpdateContextService;

  beforeEach(() => {
    service = new BatchUpdateContextService();
  });

  describe("addToBatch", () => {
    it("should add a single journal ID to the batch", () => {
      service.addToBatch("journal-1");

      expect(service.isInBatch("journal-1")).toBe(true);
      expect(service.isEmpty()).toBe(false);
    });

    it("should add multiple journal IDs to the batch", () => {
      service.addToBatch("journal-1", "journal-2", "journal-3");

      expect(service.isInBatch("journal-1")).toBe(true);
      expect(service.isInBatch("journal-2")).toBe(true);
      expect(service.isInBatch("journal-3")).toBe(true);
      expect(service.isEmpty()).toBe(false);
    });

    it("should handle adding duplicate IDs (idempotent)", () => {
      service.addToBatch("journal-1");
      service.addToBatch("journal-1"); // Duplicate

      expect(service.isInBatch("journal-1")).toBe(true);
      // Set ensures uniqueness, so size should still be 1
    });

    it("should handle empty arguments", () => {
      service.addToBatch();

      expect(service.isEmpty()).toBe(true);
    });
  });

  describe("removeFromBatch", () => {
    it("should remove a single journal ID from the batch", () => {
      service.addToBatch("journal-1");
      service.removeFromBatch("journal-1");

      expect(service.isInBatch("journal-1")).toBe(false);
      expect(service.isEmpty()).toBe(true);
    });

    it("should remove multiple journal IDs from the batch", () => {
      service.addToBatch("journal-1", "journal-2", "journal-3");
      service.removeFromBatch("journal-1", "journal-3");

      expect(service.isInBatch("journal-1")).toBe(false);
      expect(service.isInBatch("journal-2")).toBe(true);
      expect(service.isInBatch("journal-3")).toBe(false);
    });

    it("should handle removing non-existent IDs gracefully", () => {
      service.addToBatch("journal-1");
      service.removeFromBatch("journal-2"); // Not in batch

      expect(service.isInBatch("journal-1")).toBe(true);
      expect(service.isInBatch("journal-2")).toBe(false);
    });

    it("should handle empty arguments", () => {
      service.addToBatch("journal-1");
      service.removeFromBatch();

      expect(service.isInBatch("journal-1")).toBe(true);
    });
  });

  describe("clearBatch", () => {
    it("should remove all journal IDs from the batch", () => {
      service.addToBatch("journal-1", "journal-2", "journal-3");
      service.clearBatch();

      expect(service.isEmpty()).toBe(true);
      expect(service.isInBatch("journal-1")).toBe(false);
      expect(service.isInBatch("journal-2")).toBe(false);
      expect(service.isInBatch("journal-3")).toBe(false);
    });

    it("should handle clearing an empty batch", () => {
      service.clearBatch();

      expect(service.isEmpty()).toBe(true);
    });
  });

  describe("isInBatch", () => {
    it("should return true for IDs in the batch", () => {
      service.addToBatch("journal-1");

      expect(service.isInBatch("journal-1")).toBe(true);
    });

    it("should return false for IDs not in the batch", () => {
      service.addToBatch("journal-1");

      expect(service.isInBatch("journal-2")).toBe(false);
    });

    it("should return false for empty batch", () => {
      expect(service.isInBatch("journal-1")).toBe(false);
    });
  });

  describe("isEmpty", () => {
    it("should return true for empty batch", () => {
      expect(service.isEmpty()).toBe(true);
    });

    it("should return false when batch contains IDs", () => {
      service.addToBatch("journal-1");

      expect(service.isEmpty()).toBe(false);
    });

    it("should return true after clearing batch", () => {
      service.addToBatch("journal-1", "journal-2");
      service.clearBatch();

      expect(service.isEmpty()).toBe(true);
    });

    it("should return true after removing all IDs", () => {
      service.addToBatch("journal-1", "journal-2");
      service.removeFromBatch("journal-1", "journal-2");

      expect(service.isEmpty()).toBe(true);
    });
  });

  describe("concurrent operations", () => {
    it("should handle adding and removing in sequence", () => {
      service.addToBatch("journal-1", "journal-2");
      expect(service.isInBatch("journal-1")).toBe(true);
      expect(service.isInBatch("journal-2")).toBe(true);

      service.removeFromBatch("journal-1");
      expect(service.isInBatch("journal-1")).toBe(false);
      expect(service.isInBatch("journal-2")).toBe(true);

      service.addToBatch("journal-3");
      expect(service.isInBatch("journal-2")).toBe(true);
      expect(service.isInBatch("journal-3")).toBe(true);
      expect(service.isInBatch("journal-1")).toBe(false);
    });

    it("should maintain state correctly with multiple operations", () => {
      // Add some IDs
      service.addToBatch("journal-1", "journal-2");
      // Remove one
      service.removeFromBatch("journal-1");
      // Add more
      service.addToBatch("journal-3", "journal-4");
      // Remove some
      service.removeFromBatch("journal-2", "journal-3");

      expect(service.isInBatch("journal-1")).toBe(false);
      expect(service.isInBatch("journal-2")).toBe(false);
      expect(service.isInBatch("journal-3")).toBe(false);
      expect(service.isInBatch("journal-4")).toBe(true);
      expect(service.isEmpty()).toBe(false);
    });
  });
});

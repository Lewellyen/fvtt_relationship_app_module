import { describe, it, expect, beforeEach } from "vitest";
import { FoundryUIPortV13 } from "../FoundryUIPort";
import { expectResultOk, expectResultErr, createMockDOM } from "@/test/utils/test-helpers";

describe("FoundryUIPortV13", () => {
  let port: FoundryUIPortV13;

  beforeEach(() => {
    port = new FoundryUIPortV13();
  });

  describe("removeJournalElement", () => {
    it("should remove journal element successfully", () => {
      const { container, element } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-123">Journal Entry</li>`,
        'li[data-entry-id="journal-123"]'
      );

      const result = port.removeJournalElement("journal-123", "Journal Entry", container);
      expectResultOk(result);
      expect(element?.parentNode).toBeNull();
    });

    it("should fail when element not found", () => {
      const { container } = createMockDOM(`<div>Other content</div>`);

      const result = port.removeJournalElement("journal-123", "Journal Entry", container);
      expectResultErr(result);
      expect(result.error).toContain("Could not find element");
      expect(result.error).toContain("journal-123");
    });

    it("should use correct selector format", () => {
      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="test-id">Test</li>`
      );

      const result = port.removeJournalElement("test-id", "Test", container);
      expectResultOk(result);
      // Element sollte entfernt sein
      expect(container.querySelector('li[data-entry-id="test-id"]')).toBeNull();
    });

    it("should handle multiple journal entries", () => {
      const { container } = createMockDOM(`
        <ul>
          <li class="directory-item" data-entry-id="journal-1">Entry 1</li>
          <li class="directory-item" data-entry-id="journal-2">Entry 2</li>
        </ul>
      `);

      const result1 = port.removeJournalElement("journal-1", "Entry 1", container);
      expectResultOk(result1);

      const result2 = port.removeJournalElement("journal-2", "Entry 2", container);
      expectResultOk(result2);
    });
  });

  describe("findElement", () => {
    it("should find element successfully", () => {
      const { container } = createMockDOM(`<div id="target">Content</div>`);

      const result = port.findElement(container, "#target");
      expectResultOk(result);
      expect(result.value).not.toBeNull();
      expect(result.value?.id).toBe("target");
    });

    it("should return null when element not found", () => {
      const { container } = createMockDOM(`<div>Content</div>`);

      const result = port.findElement(container, "#nonexistent");
      expectResultOk(result);
      expect(result.value).toBeNull();
    });

    it("should handle complex selectors", () => {
      const { container } = createMockDOM(
        `<div class="container"><span class="nested">Text</span></div>`
      );

      const result = port.findElement(container, ".container .nested");
      expectResultOk(result);
      expect(result.value).not.toBeNull();
    });
  });
});


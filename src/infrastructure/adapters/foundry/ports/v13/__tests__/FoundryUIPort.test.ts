import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { FoundryUIPortV13 } from "@/infrastructure/adapters/foundry/ports/v13/FoundryUIPort";
import { expectResultOk, expectResultErr, createMockDOM } from "@/test/utils/test-helpers";

describe("FoundryUIPortV13", () => {
  let port: FoundryUIPortV13;

  beforeEach(() => {
    port = new FoundryUIPortV13();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("removeJournalElement", () => {
    it("should find element with data-document-id (Foundry v13)", () => {
      const html = document.createElement("div");
      html.innerHTML = `
        <ul class="directory-list">
          <li class="directory-item" data-document-id="abc123">Test Entry</li>
        </ul>
      `;

      const result = port.removeJournalElement("abc123", "Test", html);
      expectResultOk(result);
      expect(html.querySelector('[data-document-id="abc123"]')).toBeNull();
    });

    it("should find element with data-entry-id (legacy fallback)", () => {
      const html = document.createElement("div");
      html.innerHTML = `
        <ul class="directory-list">
          <li class="directory-item" data-entry-id="xyz789">Test Entry</li>
        </ul>
      `;

      const result = port.removeJournalElement("xyz789", "Test", html);
      expectResultOk(result);
      expect(html.querySelector('[data-entry-id="xyz789"]')).toBeNull();
    });

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
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toContain("Could not find element");
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

  describe("removeJournalElement - Error Cases", () => {
    it("should handle DOM manipulation errors", () => {
      const mockHtml = document.createElement("div");
      const mockElement = document.createElement("li");
      mockElement.dataset.entryId = "test-id";

      // Mock querySelector to return element with failing remove()
      vi.spyOn(mockHtml, "querySelector").mockReturnValue(mockElement);
      vi.spyOn(mockElement, "remove").mockImplementation(() => {
        throw new Error("Remove failed");
      });

      const result = port.removeJournalElement("test-id", "Test", mockHtml);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to remove element from DOM");
    });
  });

  describe("notify - Error Handling", () => {
    it("should handle missing ui.notifications", () => {
      vi.stubGlobal("ui", undefined);
      const port = new FoundryUIPortV13();

      const result = port.notify("Test message", "info");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("Foundry UI notifications not available");
    });

    it("should handle ui.notifications throwing error", () => {
      vi.stubGlobal("ui", {
        notifications: {
          info: vi.fn(() => {
            throw new Error("Notification failed");
          }),
        },
      });

      const port = new FoundryUIPortV13();
      const result = port.notify("Test", "info");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to show notification");
    });

    it("should support all notification types", () => {
      const mockNotifications = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      vi.stubGlobal("ui", { notifications: mockNotifications });

      const port = new FoundryUIPortV13();

      const result1 = port.notify("Info", "info");
      const result2 = port.notify("Warning", "warning");
      const result3 = port.notify("Error", "error");

      expectResultOk(result1);
      expectResultOk(result2);
      expectResultOk(result3);

      expect(mockNotifications.info).toHaveBeenCalledWith("Info", undefined);
      expect(mockNotifications.warn).toHaveBeenCalledWith("Warning", undefined);
      expect(mockNotifications.error).toHaveBeenCalledWith("Error", undefined);
    });

    it("should handle error notification type with exception", () => {
      const mockNotifications = {
        error: vi.fn(() => {
          throw new TypeError("Invalid argument");
        }),
      };
      vi.stubGlobal("ui", { notifications: mockNotifications });

      const port = new FoundryUIPortV13();
      const result = port.notify("Error message", "error");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.cause).toBeInstanceOf(TypeError);
    });

    it("should handle warning notification with exception", () => {
      const mockNotifications = {
        warn: vi.fn(() => {
          throw new Error("Warn failed");
        }),
      };
      vi.stubGlobal("ui", { notifications: mockNotifications });

      const port = new FoundryUIPortV13();
      const result = port.notify("Warning", "warning");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });

    it("should forward notification options to ui.notifications", () => {
      const mockNotifications = {
        info: vi.fn(),
      };
      vi.stubGlobal("ui", { notifications: mockNotifications });

      const port = new FoundryUIPortV13();
      const options = { permanent: true, console: true };

      const result = port.notify("Persistent message", "info", options);

      expectResultOk(result);
      expect(mockNotifications.info).toHaveBeenCalledWith("Persistent message", options);
    });

    it("should handle missing ui object entirely", () => {
      vi.stubGlobal("ui", null);
      const port = new FoundryUIPortV13();

      const result = port.notify("Test", "info");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
    });
  });

  describe("disposed state guards", () => {
    it("should prevent removing journal elements after disposal", () => {
      port.dispose();
      const html = document.createElement("div");

      const result = port.removeJournalElement("test", "Test", html);

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent finding elements after disposal", () => {
      port.dispose();
      const html = document.createElement("div");

      const result = port.findElement(html, "#test");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent notifications after disposal", () => {
      vi.stubGlobal("ui", { notifications: { info: vi.fn() } });
      port.dispose();

      const result = port.notify("Test", "info");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should be idempotent", () => {
      port.dispose();
      port.dispose();
      port.dispose();

      const result = port.notify("Test", "info");
      expectResultErr(result);
    });
  });
});

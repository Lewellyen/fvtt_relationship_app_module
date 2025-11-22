import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryUIAdapter } from "../foundry-ui-adapter";
import type { FoundryUI } from "../../interfaces/FoundryUI";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryUIAdapter", () => {
  let mockFoundryUI: FoundryUI;
  let adapter: FoundryUIAdapter;

  beforeEach(() => {
    mockFoundryUI = {
      removeJournalElement: vi.fn(),
      rerenderJournalDirectory: vi.fn(),
      notify: vi.fn(),
      findElement: vi.fn(),
      dispose: vi.fn(),
    };
    adapter = new FoundryUIAdapter(mockFoundryUI);
  });

  describe("removeJournalElement", () => {
    it("should delegate to FoundryUI and return success", () => {
      vi.mocked(mockFoundryUI.removeJournalElement).mockReturnValue({ ok: true, value: undefined });

      const html = document.createElement("div");
      const result = adapter.removeJournalElement("id123", "Test", html);

      expectResultOk(result);
      expect(mockFoundryUI.removeJournalElement).toHaveBeenCalledWith("id123", "Test", html);
    });

    it("should map FoundryError to PlatformUIError", () => {
      vi.mocked(mockFoundryUI.removeJournalElement).mockReturnValue({
        ok: false,
        error: { code: "NOT_FOUND", message: "Element not found" },
      });

      const result = adapter.removeJournalElement("id123", "Test", document.createElement("div"));

      expectResultErr(result);
      expect(result.error.code).toBe("DOM_MANIPULATION_FAILED");
      expect(result.error.message).toContain("Element not found");
    });
  });

  describe("rerenderJournalDirectory", () => {
    it("should delegate to FoundryUI and return boolean result", () => {
      vi.mocked(mockFoundryUI.rerenderJournalDirectory).mockReturnValue({ ok: true, value: true });

      const result = adapter.rerenderJournalDirectory();

      expectResultOk(result);
      expect(result.value).toBe(true);
      expect(mockFoundryUI.rerenderJournalDirectory).toHaveBeenCalled();
    });

    it("should map error correctly", () => {
      vi.mocked(mockFoundryUI.rerenderJournalDirectory).mockReturnValue({
        ok: false,
        error: { code: "API_NOT_AVAILABLE", message: "UI not ready" },
      });

      const result = adapter.rerenderJournalDirectory();

      expectResultErr(result);
      expect(result.error.code).toBe("RERENDER_FAILED");
      expect(result.error.message).toContain("UI not ready");
    });
  });

  describe("notify", () => {
    it("should delegate info notifications", () => {
      vi.mocked(mockFoundryUI.notify).mockReturnValue({ ok: true, value: undefined });

      const result = adapter.notify("Info message", "info");

      expectResultOk(result);
      expect(mockFoundryUI.notify).toHaveBeenCalledWith("Info message", "info");
    });

    it("should handle all notification types", () => {
      vi.mocked(mockFoundryUI.notify).mockReturnValue({ ok: true, value: undefined });

      adapter.notify("Info", "info");
      adapter.notify("Warning", "warning");
      adapter.notify("Error", "error");

      expect(mockFoundryUI.notify).toHaveBeenCalledTimes(3);
    });

    it("should map error when notify fails", () => {
      vi.mocked(mockFoundryUI.notify).mockReturnValue({
        ok: false,
        error: { code: "API_NOT_AVAILABLE", message: "UI not available" },
      });

      const result = adapter.notify("Test", "info");

      expectResultErr(result);
      expect(result.error.message).toBe("UI not available");
    });
  });
});

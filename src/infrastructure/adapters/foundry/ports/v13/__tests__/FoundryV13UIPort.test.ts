import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  FoundryV13UIPort,
  createFoundryV13UIPort,
} from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13UIPort";
import type {
  IFoundryUIAPI,
  IFoundryGameJournalAPI,
  IFoundryDocumentAPI,
} from "@/infrastructure/adapters/foundry/api/foundry-api.interface";
import { expectResultOk, expectResultErr, createMockDOM } from "@/test/utils/test-helpers";

describe("FoundryV13UIPort", () => {
  let port: FoundryV13UIPort;
  let mockUIAPI: IFoundryUIAPI;
  let mockGameJournalAPI: IFoundryGameJournalAPI;
  let mockDocumentAPI: IFoundryDocumentAPI;

  beforeEach(() => {
    mockUIAPI = {
      notifications: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };
    mockGameJournalAPI = {
      contents: [],
      get: vi.fn(),
      directory: undefined,
    };
    mockDocumentAPI = {
      querySelector: (selector: string) => document.querySelector(selector),
    };
    port = new FoundryV13UIPort(mockUIAPI, mockGameJournalAPI, mockDocumentAPI);
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

  describe("notify - Error Handling", () => {
    it("should handle missing ui.notifications", () => {
      const portWithoutNotifications = new FoundryV13UIPort(
        {
          notifications: null as unknown as IFoundryUIAPI["notifications"],
        },
        mockGameJournalAPI,
        mockDocumentAPI
      );

      const result = portWithoutNotifications.notify("Test message", "info");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("Foundry UI notifications not available");
    });

    it("should handle ui.notifications throwing error", () => {
      mockUIAPI.notifications.info = vi.fn(() => {
        throw new Error("Notification failed");
      });

      const result = port.notify("Test", "info");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to show notification");
    });

    it("should support all notification types", () => {
      const result1 = port.notify("Info", "info");
      const result2 = port.notify("Warning", "warning");
      const result3 = port.notify("Error", "error");

      expectResultOk(result1);
      expectResultOk(result2);
      expectResultOk(result3);

      expect(mockUIAPI.notifications.info).toHaveBeenCalledWith("Info", undefined);
      expect(mockUIAPI.notifications.warn).toHaveBeenCalledWith("Warning", undefined);
      expect(mockUIAPI.notifications.error).toHaveBeenCalledWith("Error", undefined);
    });

    it("should handle error notification type with exception", () => {
      mockUIAPI.notifications.error = vi.fn(() => {
        throw new TypeError("Invalid argument");
      });

      const result = port.notify("Error message", "error");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.cause).toBeInstanceOf(TypeError);
    });

    it("should handle warning notification with exception", () => {
      mockUIAPI.notifications.warn = vi.fn(() => {
        throw new Error("Warn failed");
      });

      const result = port.notify("Warning", "warning");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });

    it("should forward notification options to ui.notifications", () => {
      const options = { permanent: true, console: true };

      const result = port.notify("Persistent message", "info", options);

      expectResultOk(result);
      expect(mockUIAPI.notifications.info).toHaveBeenCalledWith("Persistent message", options);
    });

    it("should handle missing ui object entirely", () => {
      const portWithoutUI = new FoundryV13UIPort(
        null as unknown as IFoundryUIAPI,
        mockGameJournalAPI,
        mockDocumentAPI
      );

      const result = portWithoutUI.notify("Test", "info");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
    });
  });

  describe("rerenderJournalDirectory", () => {
    it("should return false when journal directory is not open", () => {
      // No #journal element in DOM
      const result = port.rerenderJournalDirectory();
      expectResultOk(result);
      expect(result.value).toBe(false);
    });

    it("should call game.journal.directory.render() when available", () => {
      const journalDiv = document.createElement("div");
      journalDiv.id = "journal";
      document.body.appendChild(journalDiv);

      const mockDirectoryRender = vi.fn();
      mockGameJournalAPI.directory = {
        render: mockDirectoryRender,
      };

      const result = port.rerenderJournalDirectory();
      expectResultOk(result);
      expect(result.value).toBe(true);
      expect(mockDirectoryRender).toHaveBeenCalled();

      document.body.removeChild(journalDiv);
    });

    it("should return false when game.journal.directory.render() is not available", () => {
      const journalDiv = document.createElement("div");
      journalDiv.id = "journal";
      document.body.appendChild(journalDiv);

      mockGameJournalAPI.directory = undefined;

      const result = port.rerenderJournalDirectory();
      expectResultOk(result);
      expect(result.value).toBe(false);

      document.body.removeChild(journalDiv);
    });

    it("should return error when port is disposed", () => {
      port.dispose();
      const result = port.rerenderJournalDirectory();
      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should handle exceptions gracefully", () => {
      const journalDiv = document.createElement("div");
      journalDiv.id = "journal";
      document.body.appendChild(journalDiv);

      const mockRender = vi.fn().mockImplementation(() => {
        throw new Error("Render failed");
      });

      mockGameJournalAPI.directory = {
        render: mockRender,
      };

      const result = port.rerenderJournalDirectory();
      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");

      document.body.removeChild(journalDiv);
    });
  });

  describe("removeJournalDirectoryEntry", () => {
    it("should remove journal directory entry successfully", () => {
      // Create journal container with entry
      const journalContainer = document.createElement("div");
      journalContainer.id = "journal";
      const listItem = document.createElement("li");
      listItem.className = "directory-item";
      listItem.setAttribute("data-document-id", "test-journal-1");
      journalContainer.appendChild(listItem);
      document.body.appendChild(journalContainer);

      const result = port.removeJournalDirectoryEntry("journal", "test-journal-1", "Test Journal");

      expectResultOk(result);
      expect(listItem.parentElement).toBeNull(); // Element should be removed

      document.body.removeChild(journalContainer);
    });

    it("should return error when port is disposed", () => {
      port.dispose();

      const result = port.removeJournalDirectoryEntry("journal", "test", "Test");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should return error when getDirectoryElement fails", () => {
      // Mock getDirectoryElement to return error by making querySelector throw
      const originalQuerySelector = mockDocumentAPI.querySelector;
      mockDocumentAPI.querySelector = vi.fn(() => {
        throw new Error("QuerySelector failed");
      });

      const result = port.removeJournalDirectoryEntry("journal", "test", "Test");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get directory element");

      // Restore
      mockDocumentAPI.querySelector = originalQuerySelector;
    });

    it("should return error when directory element is not found", () => {
      // No #journal element in DOM
      const result = port.removeJournalDirectoryEntry("journal", "test", "Test");

      expectResultErr(result);
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toContain("Directory element not found");
    });

    it("should return error when journal entry element is not found in directory", () => {
      // Create journal container but without the specific entry
      const journalContainer = document.createElement("div");
      journalContainer.id = "journal";
      document.body.appendChild(journalContainer);

      const result = port.removeJournalDirectoryEntry("journal", "non-existent", "Test Journal");

      expectResultErr(result);
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toContain("Could not find directory entry for journal");

      document.body.removeChild(journalContainer);
    });

    it("should handle error when element.remove() throws", () => {
      // Create journal container with entry
      const journalContainer = document.createElement("div");
      journalContainer.id = "journal";
      const listItem = document.createElement("li");
      listItem.className = "directory-item";
      listItem.setAttribute("data-document-id", "test-journal-1");
      journalContainer.appendChild(listItem);
      document.body.appendChild(journalContainer);

      // Mock remove to throw error
      const originalRemove = listItem.remove;
      listItem.remove = vi.fn(() => {
        throw new Error("Remove failed");
      });

      const result = port.removeJournalDirectoryEntry("journal", "test-journal-1", "Test Journal");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to remove element from DOM");

      // Restore
      listItem.remove = originalRemove;
      document.body.removeChild(journalContainer);
    });

    it("should support data-entry-id selector for older Foundry versions", () => {
      // Create journal container with entry using data-entry-id
      const journalContainer = document.createElement("div");
      journalContainer.id = "journal";
      const listItem = document.createElement("li");
      listItem.className = "directory-item";
      listItem.setAttribute("data-entry-id", "test-journal-2");
      journalContainer.appendChild(listItem);
      document.body.appendChild(journalContainer);

      const result = port.removeJournalDirectoryEntry("journal", "test-journal-2", "Test Journal");

      expectResultOk(result);
      expect(listItem.parentElement).toBeNull(); // Element should be removed

      document.body.removeChild(journalContainer);
    });
  });

  describe("disposed state guards", () => {
    it("should prevent finding elements after disposal", () => {
      port.dispose();
      const html = document.createElement("div");

      const result = port.findElement(html, "#test");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent notifications after disposal", () => {
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

  describe("getDirectoryElement", () => {
    it("should return element when directoryId is 'journal' and element exists", () => {
      const journalDiv = document.createElement("div");
      journalDiv.id = "journal";
      document.body.appendChild(journalDiv);

      const result = port.getDirectoryElement("journal");
      expectResultOk(result);
      expect(result.value).not.toBeNull();
      expect(result.value?.id).toBe("journal");

      document.body.removeChild(journalDiv);
    });

    it("should return null when directoryId is 'journal' but element does not exist", () => {
      const result = port.getDirectoryElement("journal");
      expectResultOk(result);
      expect(result.value).toBeNull();
    });

    it("should return null for other directory IDs (coverage for lines 125-126)", () => {
      const result = port.getDirectoryElement("other-directory");
      expectResultOk(result);
      expect(result.value).toBeNull();
    });

    it("should return error when port is disposed (coverage for line 118)", () => {
      port.dispose();
      const result = port.getDirectoryElement("journal");
      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should handle exceptions gracefully (coverage for line 132)", () => {
      // Mock querySelector to throw error
      const originalQuerySelector = mockDocumentAPI.querySelector;
      mockDocumentAPI.querySelector = vi.fn(() => {
        throw new Error("QuerySelector failed");
      });

      const result = port.getDirectoryElement("journal");
      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get directory element");

      // Restore original
      mockDocumentAPI.querySelector = originalQuerySelector;
    });
  });

  describe("createFoundryV13UIPort factory", () => {
    beforeEach(() => {
      vi.unstubAllGlobals();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should throw when ui is undefined", () => {
      // @ts-expect-error - intentionally undefined for test
      global.ui = undefined;
      // @ts-expect-error - intentionally undefined for test
      global.game = undefined;

      expect(() => createFoundryV13UIPort()).toThrow("Foundry UI API not available");
    });

    it("should throw when ui.notifications is missing", () => {
      // @ts-expect-error - intentionally missing notifications for test
      global.ui = {};
      // @ts-expect-error - intentionally undefined for test
      global.game = undefined;

      expect(() => createFoundryV13UIPort()).toThrow("Foundry UI API not available");
    });

    it("should throw when game is undefined", () => {
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      };
      // @ts-expect-error - intentionally undefined for test
      global.game = undefined;

      expect(() => createFoundryV13UIPort()).toThrow("Foundry game API not available");
    });

    it("should throw when game.journal is missing", () => {
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      };
      // @ts-expect-error - intentionally missing journal for test
      global.game = {};

      expect(() => createFoundryV13UIPort()).toThrow("Foundry game API not available");
    });

    it("should create port successfully with all APIs available", () => {
      const mockInfo = vi.fn();
      const mockWarn = vi.fn();
      const mockError = vi.fn();
      const mockJournalGet = vi.fn();

      const mockJournalContents = [{ id: "test-1", name: "Test", getFlag: vi.fn() }] as any[];

      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: mockInfo,
          warn: mockWarn,
          error: mockError,
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: mockJournalContents,
          get: mockJournalGet,
        },
      };

      const port = createFoundryV13UIPort();
      expect(port).toBeInstanceOf(FoundryV13UIPort);

      // Test that notifications work
      const result = port.notify("Test message", "info");
      expectResultOk(result);
      expect(mockInfo).toHaveBeenCalledWith("Test message", undefined);
    });

    it("should work with directory.render when available", () => {
      const mockDirectoryRender = vi.fn();
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
          directory: {
            render: mockDirectoryRender,
          },
        },
      };

      // Create DOM element for querySelector("#journal")
      const journalElement = document.createElement("div");
      journalElement.id = "journal";
      document.body.appendChild(journalElement);

      const port = createFoundryV13UIPort();
      expect(port).toBeInstanceOf(FoundryV13UIPort);

      // Test that rerenderJournalDirectory uses directory.render
      const result = port.rerenderJournalDirectory();
      expectResultOk(result);
      expect(result.value).toBe(true);
      expect(mockDirectoryRender).toHaveBeenCalled();

      document.body.removeChild(journalElement);
    });

    it("should work without sidebar", () => {
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        // sidebar is undefined
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
        },
      };

      const port = createFoundryV13UIPort();
      expect(port).toBeInstanceOf(FoundryV13UIPort);
    });

    it("should work without sidebar", () => {
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        // sidebar is undefined - Foundry v13 doesn't expose sidebar.tabs via public API
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
        },
      };

      const port = createFoundryV13UIPort();
      expect(port).toBeInstanceOf(FoundryV13UIPort);

      // Sidebar should not be set in Foundry v13
      const uiAPI = (port as any).foundryUIAPI;
      expect(uiAPI.sidebar).toBeUndefined();
    });

    it("should include directory when game.journal.directory.render is available", () => {
      const mockDirectoryRender = vi.fn();
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
          directory: {
            render: mockDirectoryRender,
          },
        },
      };

      // Create DOM element for querySelector("#journal")
      const journalElement = document.createElement("div");
      journalElement.id = "journal";
      document.body.appendChild(journalElement);

      const port = createFoundryV13UIPort();
      expect(port).toBeInstanceOf(FoundryV13UIPort);

      // The directory should be available through the journal API
      const result = port.rerenderJournalDirectory();
      expectResultOk(result);
      expect(result.value).toBe(true);
      expect(mockDirectoryRender).toHaveBeenCalledOnce();

      document.body.removeChild(journalElement);
    });

    it("should work without directory", () => {
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
          // directory is undefined
        },
      };

      const port = createFoundryV13UIPort();
      expect(port).toBeInstanceOf(FoundryV13UIPort);
    });

    it("should work without directory.render", () => {
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
          directory: {
            // render is undefined
          },
        },
      };

      const port = createFoundryV13UIPort();
      expect(port).toBeInstanceOf(FoundryV13UIPort);
    });

    it("should call ui.notifications.warn through factory-created port", () => {
      const mockWarn = vi.fn();
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
        },
      };

      const port = createFoundryV13UIPort();
      const result = port.notify("Warning message", "warning");
      expectResultOk(result);
      expect(mockWarn).toHaveBeenCalledWith("Warning message", undefined);
    });

    it("should call ui.notifications.error through factory-created port", () => {
      const mockError = vi.fn();
      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: mockError,
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
        },
      };

      const port = createFoundryV13UIPort();
      const result = port.notify("Error message", "error");
      expectResultOk(result);
      expect(mockError).toHaveBeenCalledWith("Error message", undefined);
    });

    it("should use game.journal.get through factory-created port", () => {
      const mockJournalEntry = { id: "test-id", name: "Test", getFlag: vi.fn() };
      const mockGet = vi.fn((id: string) => (id === "test-id" ? mockJournalEntry : undefined));

      // @ts-expect-error - intentionally typed for test
      global.ui = {
        notifications: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: mockGet,
        },
      };

      const port = createFoundryV13UIPort();
      expect(port).toBeInstanceOf(FoundryV13UIPort);

      // Access the private foundryGameJournalAPI property to test that get function works
      // This ensures line 225 (get: (id: string) => game.journal.get(id)) is executed when called
      const journalAPI = (port as any).foundryGameJournalAPI;
      expect(journalAPI.get).toBeDefined();
      expect(typeof journalAPI.get).toBe("function");

      // Call the get function to ensure it uses game.journal.get (line 225 execution)
      const result = journalAPI.get("test-id");
      expect(result).toBe(mockJournalEntry);
      expect(mockGet).toHaveBeenCalledWith("test-id");
    });

    it("should handle ui.notifications becoming null at runtime in notification methods", () => {
      const mockInfo = vi.fn();
      const mockWarn = vi.fn();
      const mockError = vi.fn();

      // Create a mutable notifications object
      const notifications = {
        info: mockInfo,
        warn: mockWarn,
        error: mockError,
      };

      // @ts-expect-error - intentionally typed for test
      global.ui = {
        get notifications() {
          return notifications;
        },
      };

      // @ts-expect-error - intentionally typed for test
      global.game = {
        journal: {
          contents: [],
          get: vi.fn(),
        },
      };

      const port = createFoundryV13UIPort();

      // Access the private foundryUIAPI to test the defensive checks
      const uiAPI = (port as any).foundryUIAPI;

      // Set notifications to null to test the else branches
      // @ts-expect-error - intentionally null for test
      Object.defineProperty(global.ui, "notifications", {
        get: () => null,
        configurable: true,
      });

      // These should not throw, but should silently handle null notifications
      // This tests the else branches in the notification methods (lines 735, 740, 745)
      expect(() => uiAPI.notifications.info("test", undefined)).not.toThrow();
      expect(() => uiAPI.notifications.warn("test", undefined)).not.toThrow();
      expect(() => uiAPI.notifications.error("test", undefined)).not.toThrow();

      // Verify that the original functions were not called
      expect(mockInfo).not.toHaveBeenCalled();
      expect(mockWarn).not.toHaveBeenCalled();
      expect(mockError).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryUtilsPort, createFoundryUtilsPort, DIFoundryUtilsPort } from "../FoundryUtilsPort";
import type { IFoundryUtilsAPI } from "../../api/foundry-api.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryUtilsPort", () => {
  let service: FoundryUtilsPort;
  let mockAPI: IFoundryUtilsAPI;

  beforeEach(() => {
    mockAPI = {
      randomID: vi.fn().mockReturnValue("test-id-123"),
      fromUuid: vi.fn().mockResolvedValue({ id: "test-doc" }),
      fromUuidSync: vi.fn().mockReturnValue({ id: "test-doc" }),
      parseUuid: vi.fn().mockReturnValue({
        uuid: "JournalEntry.abc123",
        collection: undefined,
        documentId: "abc123",
        documentType: "JournalEntry",
        doc: null,
        embedded: [],
      }),
      buildUuid: vi.fn().mockReturnValue("JournalEntry.abc123"),
      deepClone: vi.fn((obj) => JSON.parse(JSON.stringify(obj))),
      mergeObject: vi.fn((original, updates) => ({ ...original, ...updates })),
      diffObject: vi.fn().mockReturnValue({ changed: "value" }),
      flattenObject: vi.fn().mockReturnValue({ ["a.b"]: 1 }),
      expandObject: vi.fn().mockReturnValue({ a: { b: 1 } }),
      cleanHTML: vi.fn((html) =>
        // Remove all script tags and their content, including variants with whitespace and attributes
        // Pattern matches: <script>, <script >, <SCRIPT>, <script type="...">, </script>, </script >, etc.
        // Using [\s\S]*? to match any character including newlines, and [^>]* to match attributes
        html.replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/gi, "")
      ),
      escapeHTML: vi.fn((str) =>
        str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      ),
      unescapeHTML: vi.fn((str) =>
        str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
      ),
      fetchWithTimeout: vi.fn().mockResolvedValue(new Response()),
      fetchJsonWithTimeout: vi.fn().mockResolvedValue({ data: "test" }),
    };

    service = new FoundryUtilsPort(mockAPI);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("UUID Functions", () => {
    describe("randomID", () => {
      it("should return random ID from API", () => {
        const id = service.randomID();
        expect(id).toBe("test-id-123");
        expect(mockAPI.randomID).toHaveBeenCalledOnce();
      });

      it("should return fallback ID when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const id = nullService.randomID();
        expect(id).toMatch(/^fallback-\d+-[a-z0-9]+$/);
      });

      it("should return fallback ID when API throws", () => {
        (mockAPI.randomID as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const id = service.randomID();
        expect(id).toMatch(/^fallback-\d+-[a-z0-9]+$/);
      });

      it("should return empty string when disposed", () => {
        service.dispose();
        const id = service.randomID();
        expect(id).toBe("");
      });
    });

    describe("fromUuid", () => {
      it("should resolve UUID to document", async () => {
        const result = await service.fromUuid("JournalEntry.abc123");
        expectResultOk(result);
        expect(result.value).toEqual({ id: "test-doc" });
        expect(mockAPI.fromUuid).toHaveBeenCalledWith("JournalEntry.abc123");
      });

      it("should return null when API is null", async () => {
        const nullService = new FoundryUtilsPort(null);
        const result = await nullService.fromUuid("JournalEntry.abc123");
        expectResultOk(result);
        expect(result.value).toBeNull();
      });

      it("should return error when API throws", async () => {
        (mockAPI.fromUuid as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("API error"));
        const result = await service.fromUuid("JournalEntry.abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when disposed", async () => {
        service.dispose();
        const result = await service.fromUuid("JournalEntry.abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });

    describe("fromUuidSync", () => {
      it("should resolve UUID synchronously", () => {
        const result = service.fromUuidSync("JournalEntry.abc123");
        expectResultOk(result);
        expect(result.value).toEqual({ id: "test-doc" });
        expect(mockAPI.fromUuidSync).toHaveBeenCalledWith("JournalEntry.abc123");
      });

      it("should return null when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const result = nullService.fromUuidSync("JournalEntry.abc123");
        expectResultOk(result);
        expect(result.value).toBeNull();
      });

      it("should return error when API throws", () => {
        (mockAPI.fromUuidSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const result = service.fromUuidSync("JournalEntry.abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when disposed", () => {
        service.dispose();
        const result = service.fromUuidSync("JournalEntry.abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });

    describe("parseUuid", () => {
      it("should parse UUID into components", () => {
        const result = service.parseUuid("JournalEntry.abc123");
        expectResultOk(result);
        expect(result.value).toEqual({
          type: "JournalEntry",
          documentName: "JournalEntry",
          documentId: "abc123",
        });
      });

      it("should return error when API throws", () => {
        (mockAPI.parseUuid as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const result = service.parseUuid("JournalEntry.abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const result = nullService.parseUuid("JournalEntry.abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when disposed", () => {
        service.dispose();
        const result = service.parseUuid("JournalEntry.abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });

    describe("buildUuid", () => {
      it("should build UUID from components", () => {
        const result = service.buildUuid("JournalEntry", "JournalEntry", "abc123");
        expectResultOk(result);
        expect(result.value).toBe("JournalEntry.abc123");
      });

      it("should default documentName to type when empty", () => {
        const result = service.buildUuid("JournalEntry", "", "abc123");
        expectResultOk(result);
        expect(mockAPI.buildUuid).toHaveBeenCalledWith({
          documentName: "JournalEntry",
          id: "abc123",
          pack: null,
        });
      });

      it("should return error when API returns null", () => {
        (mockAPI.buildUuid as ReturnType<typeof vi.fn>).mockReturnValue(null);
        const result = service.buildUuid("JournalEntry", "JournalEntry", "missing");
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API throws", () => {
        (mockAPI.buildUuid as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const result = service.buildUuid("JournalEntry", "JournalEntry", "abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const result = nullService.buildUuid("JournalEntry", "JournalEntry", "abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when disposed", () => {
        service.dispose();
        const result = service.buildUuid("JournalEntry", "JournalEntry", "abc123");
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });
  });

  describe("Object Functions", () => {
    describe("deepClone", () => {
      it("should deep clone object", () => {
        const original = { a: 1, b: { c: 2 } };
        const result = service.deepClone(original);
        expectResultOk(result);
        expect(result.value).toEqual(original);
        expect(result.value).not.toBe(original);
        expect(mockAPI.deepClone).toHaveBeenCalledWith(original);
      });

      it("should return error when API throws", () => {
        (mockAPI.deepClone as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const result = service.deepClone({ a: 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const result = nullService.deepClone({ a: 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when disposed", () => {
        service.dispose();
        const result = service.deepClone({ a: 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });

    describe("mergeObject", () => {
      it("should merge objects", () => {
        const original = { a: 1, b: 2 };
        const updates = { b: 3, c: 4 };
        const result = service.mergeObject(original, updates);
        expectResultOk(result);
        expect(result.value).toEqual({ a: 1, b: 3, c: 4 });
        expect(mockAPI.mergeObject).toHaveBeenCalledWith(original, updates, undefined);
      });

      it("should return error when API throws", () => {
        (mockAPI.mergeObject as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const result = service.mergeObject({ a: 1 }, { b: 2 });
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const result = nullService.mergeObject({ a: 1 }, { b: 2 });
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when disposed", () => {
        service.dispose();
        const result = service.mergeObject({ a: 1 }, { b: 2 });
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });

    describe("diffObject", () => {
      it("should compute object difference", () => {
        const original = { a: 1, b: 2 };
        const updated = { a: 1, b: 3, c: 4 };
        const result = service.diffObject(original, updated);
        expectResultOk(result);
        expect(result.value).toEqual({ changed: "value" });
        expect(mockAPI.diffObject).toHaveBeenCalledWith(original, updated);
      });

      it("should return error when original is not an object", () => {
        const result = service.diffObject("not-an-object", { b: 2 });
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when updated is not an object", () => {
        const result = service.diffObject({ a: 1 }, "not-an-object");
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API throws", () => {
        (mockAPI.diffObject as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const result = service.diffObject({ a: 1 }, { b: 2 });
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const result = nullService.diffObject({ a: 1 }, { b: 2 });
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when disposed", () => {
        service.dispose();
        const result = service.diffObject({ a: 1 }, { b: 2 });
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });

    describe("flattenObject", () => {
      it("should flatten nested object", () => {
        const nested = { a: { b: { c: 1 } } };
        const result = service.flattenObject(nested);
        expectResultOk(result);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        expect(result.value).toEqual({ "a.b": 1 });
        expect(mockAPI.flattenObject).toHaveBeenCalledWith(nested);
      });

      it("should return error when value is not an object", () => {
        const result = service.flattenObject("not-an-object");
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API throws", () => {
        (mockAPI.flattenObject as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const result = service.flattenObject({ a: 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const result = nullService.flattenObject({ a: 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when disposed", () => {
        service.dispose();
        const result = service.flattenObject({ a: 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });

    describe("expandObject", () => {
      it("should expand flat object", () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const flat = { "a.b": 1 };
        const result = service.expandObject(flat);
        expectResultOk(result);
        expect(result.value).toEqual({ a: { b: 1 } });
        expect(mockAPI.expandObject).toHaveBeenCalledWith(flat);
      });

      it("should return error when API throws", () => {
        (mockAPI.expandObject as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const result = service.expandObject({ "a.b": 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const result = nullService.expandObject({ "a.b": 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when disposed", () => {
        service.dispose();
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const result = service.expandObject({ "a.b": 1 });
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });
  });

  describe("HTML Functions", () => {
    describe("cleanHTML", () => {
      it("should clean HTML string", () => {
        const dirty = "<script>alert('xss')</script><p>Safe</p>";
        const result = service.cleanHTML(dirty);
        expectResultOk(result);
        expect(result.value).toBe("<p>Safe</p>");
        expect(mockAPI.cleanHTML).toHaveBeenCalledWith(dirty);
      });

      it("should return error when API throws", () => {
        (mockAPI.cleanHTML as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const result = service.cleanHTML("<p>Test</p>");
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return HTML as-is when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const html = "<p>Test</p>";
        const result = nullService.cleanHTML(html);
        expectResultOk(result);
        expect(result.value).toBe(html);
      });

      it("should return error when disposed", () => {
        service.dispose();
        const result = service.cleanHTML("<p>Test</p>");
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });

      describe("Edge Cases: Script tag variants (Security Fix)", () => {
        it("should remove script tags with space before closing tag: </script >", () => {
          const dirty = "<script>alert(1)</script >";
          const result = service.cleanHTML(dirty);
          expectResultOk(result);
          expect(result.value).toBe("");
        });

        it("should remove script tags with attributes in closing tag: </script foo='bar'>", () => {
          const dirty = "<script>alert(1)</script foo='bar'>";
          const result = service.cleanHTML(dirty);
          expectResultOk(result);
          expect(result.value).toBe("");
        });

        it("should remove mixed script tags: <script></script >", () => {
          const dirty = "<script>alert(1)</script ><p>Safe</p>";
          const result = service.cleanHTML(dirty);
          expectResultOk(result);
          expect(result.value).toBe("<p>Safe</p>");
        });

        it("should remove uppercase script tags: <SCRIPT></SCRIPT >", () => {
          const dirty = "<SCRIPT>alert(1)</SCRIPT ><p>Safe</p>";
          const result = service.cleanHTML(dirty);
          expectResultOk(result);
          expect(result.value).toBe("<p>Safe</p>");
        });

        it("should remove script tags with attributes in opening tag", () => {
          const dirty = '<script type="text/javascript">alert(1)</script>';
          const result = service.cleanHTML(dirty);
          expectResultOk(result);
          expect(result.value).toBe("");
        });
      });
    });

    describe("escapeHTML", () => {
      it("should escape HTML characters", () => {
        const str = "<div>Test</div>";
        const escaped = service.escapeHTML(str);
        expect(escaped).toBe("&lt;div&gt;Test&lt;/div&gt;");
        expect(mockAPI.escapeHTML).toHaveBeenCalledWith(str);
      });

      it("should use fallback when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const str = "<div>Test</div>";
        const escaped = nullService.escapeHTML(str);
        expect(escaped).toContain("&lt;");
      });

      it("should fallback when API throws", () => {
        (mockAPI.escapeHTML as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const str = "<div>Test</div>";
        const escaped = service.escapeHTML(str);
        expect(escaped).toContain("&lt;");
      });

      it("should return string as-is when disposed", () => {
        service.dispose();
        const str = "<div>Test</div>";
        const escaped = service.escapeHTML(str);
        expect(escaped).toBe(str);
      });
    });

    describe("unescapeHTML", () => {
      it("should unescape HTML entities", () => {
        const str = "&lt;div&gt;Test&lt;/div&gt;";
        const unescaped = service.unescapeHTML(str);
        expect(unescaped).toBe("<div>Test</div>");
        expect(mockAPI.unescapeHTML).toHaveBeenCalledWith(str);
      });

      it("should use fallback when API is null", () => {
        const nullService = new FoundryUtilsPort(null);
        const str = "&lt;div&gt;Test&lt;/div&gt;";
        const unescaped = nullService.unescapeHTML(str);
        expect(unescaped).toContain("<");
      });

      it("should fallback when API throws", () => {
        (mockAPI.unescapeHTML as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("API error");
        });
        const str = "&lt;div&gt;Test&lt;/div&gt;";
        const unescaped = service.unescapeHTML(str);
        expect(unescaped).toContain("<");
      });

      it("should return string as-is when disposed", () => {
        service.dispose();
        const str = "&lt;div&gt;Test&lt;/div&gt;";
        const unescaped = service.unescapeHTML(str);
        expect(unescaped).toBe(str);
      });

      describe("Edge Cases: Double-escaped entities (Security Fix)", () => {
        it("should correctly unescape &amp;amp; to &", () => {
          const nullService = new FoundryUtilsPort(null);
          const str = "&amp;amp;";
          const unescaped = nullService.unescapeHTML(str);
          expect(unescaped).toBe("&");
        });

        it('should correctly unescape &amp;quot; to "', () => {
          const nullService = new FoundryUtilsPort(null);
          const str = "&amp;quot;";
          const unescaped = nullService.unescapeHTML(str);
          expect(unescaped).toBe('"');
        });

        it("should correctly unescape &amp;lt; to <", () => {
          const nullService = new FoundryUtilsPort(null);
          const str = "&amp;lt;";
          const unescaped = nullService.unescapeHTML(str);
          expect(unescaped).toBe("<");
        });

        it("should correctly unescape &amp;gt; to >", () => {
          const nullService = new FoundryUtilsPort(null);
          const str = "&amp;gt;";
          const unescaped = nullService.unescapeHTML(str);
          expect(unescaped).toBe(">");
        });

        it("should correctly unescape combinations like &lt;script&gt;", () => {
          const nullService = new FoundryUtilsPort(null);
          const str = "&lt;script&gt;alert(1)&lt;/script&gt;";
          const unescaped = nullService.unescapeHTML(str);
          expect(unescaped).toBe("<script>alert(1)</script>");
        });

        it("should correctly unescape mixed double-escaped entities", () => {
          const nullService = new FoundryUtilsPort(null);
          const str = "&amp;amp;&amp;quot;&amp;lt;test&amp;gt;";
          const unescaped = nullService.unescapeHTML(str);
          expect(unescaped).toBe('&"<test>');
        });
      });
    });
  });

  describe("Async Functions", () => {
    describe("fetchWithTimeout", () => {
      it("should fetch with timeout", async () => {
        const result = await service.fetchWithTimeout("/api/data", {}, 5000);
        expectResultOk(result);
        expect(result.value).toBeInstanceOf(Response);
        expect(mockAPI.fetchWithTimeout).toHaveBeenCalledWith("/api/data", {}, { timeoutMs: 5000 });
      });

      it("should return error when API is null", async () => {
        const nullService = new FoundryUtilsPort(null);
        const result = await nullService.fetchWithTimeout("/api/data", {}, 5000);
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when API throws", async () => {
        (mockAPI.fetchWithTimeout as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error("API error")
        );
        const result = await service.fetchWithTimeout("/api/data", {}, 5000);
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when disposed", async () => {
        service.dispose();
        const result = await service.fetchWithTimeout("/api/data", {}, 5000);
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });

    describe("fetchJsonWithTimeout", () => {
      it("should fetch JSON with timeout", async () => {
        const result = await service.fetchJsonWithTimeout("/api/data", {}, 5000);
        expectResultOk(result);
        expect(result.value).toEqual({ data: "test" });
        expect(mockAPI.fetchJsonWithTimeout).toHaveBeenCalledWith(
          "/api/data",
          {},
          {
            timeoutMs: 5000,
          }
        );
      });

      it("should return error when API is null", async () => {
        const nullService = new FoundryUtilsPort(null);
        const result = await nullService.fetchJsonWithTimeout("/api/data", {}, 5000);
        expectResultErr(result);
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      });

      it("should return error when API throws", async () => {
        (mockAPI.fetchJsonWithTimeout as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error("API error")
        );
        const result = await service.fetchJsonWithTimeout("/api/data", {}, 5000);
        expectResultErr(result);
        expect(result.error.code).toBe("OPERATION_FAILED");
      });

      it("should return error when disposed", async () => {
        service.dispose();
        const result = await service.fetchJsonWithTimeout("/api/data", {}, 5000);
        expectResultErr(result);
        expect(result.error.code).toBe("DISPOSED");
      });
    });
  });

  describe("Disposal", () => {
    it("should be idempotent", () => {
      service.dispose();
      service.dispose();
      service.dispose();
      // Should not throw
      expect(() => service.dispose()).not.toThrow();
    });

    it("should prevent operations after disposal", async () => {
      service.dispose();
      const result = await service.fromUuid("JournalEntry.abc123");
      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });
  });

  describe("Factory Function", () => {
    it("should create port with real API when foundry.utils is available", () => {
      vi.stubGlobal("foundry", {
        utils: {
          randomID: vi.fn().mockReturnValue("real-id"),
          fromUuid: vi.fn(),
          fromUuidSync: vi.fn(),
          parseUuid: vi.fn(),
          buildUuid: vi.fn(),
          deepClone: vi.fn(),
          mergeObject: vi.fn(),
          diffObject: vi.fn(),
          flattenObject: vi.fn(),
          expandObject: vi.fn(),
          cleanHTML: vi.fn(),
          escapeHTML: vi.fn(),
          unescapeHTML: vi.fn(),
          fetchWithTimeout: vi.fn(),
          fetchJsonWithTimeout: vi.fn(),
        },
      });

      const port = createFoundryUtilsPort();
      expect(port).toBeInstanceOf(FoundryUtilsPort);
      const id = port.randomID();
      expect(id).toBe("real-id");

      vi.unstubAllGlobals();
    });

    it("should map Foundry utils calls through factory instance", async () => {
      const parseUuidMock = vi.fn().mockReturnValue({
        uuid: "JournalEntry.abc123",
        collection: "test-pack",
        documentId: "abc123",
        documentType: "JournalEntry",
        doc: null,
        embedded: [],
      });
      const buildUuidMock = vi.fn().mockReturnValue("JournalEntry.abc123");

      vi.stubGlobal("foundry", {
        utils: {
          randomID: vi.fn().mockReturnValue("real-id"),
          fromUuid: vi.fn().mockResolvedValue({ id: "real-doc" }),
          fromUuidSync: vi.fn().mockReturnValue({ id: "real-doc" }),
          parseUuid: parseUuidMock,
          buildUuid: buildUuidMock,
          deepClone: vi.fn((obj) => ({ ...obj })),
          mergeObject: vi.fn((original, updates) => ({ ...original, ...updates })),
          diffObject: vi.fn().mockReturnValue({ changed: "value" }),
          flattenObject: vi.fn().mockReturnValue({ ["a.b"]: 1 }),
          expandObject: vi.fn().mockReturnValue({ a: { b: 1 } }),
          cleanHTML: vi.fn((html) =>
            // Remove all script tags and their content, including variants with whitespace and attributes
            // Pattern matches: <script>, <script >, <SCRIPT>, <script type="...">, </script>, </script >, etc.
            // Using [\s\S]*? to match any character including newlines, and [^>]* to match attributes
            html.replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/gi, "")
          ),
          escapeHTML: vi.fn((str) => str.replace(/</g, "&lt;")),
          unescapeHTML: vi.fn((str) => str.replace(/&lt;/g, "<")),
          fetchWithTimeout: vi.fn().mockResolvedValue(new Response()),
          fetchJsonWithTimeout: vi.fn().mockResolvedValue({ data: "test" }),
        },
      });

      const port = createFoundryUtilsPort();

      await port.fromUuid("JournalEntry.abc123");
      port.fromUuidSync("JournalEntry.abc123");
      port.parseUuid("JournalEntry.abc123");
      port.buildUuid("JournalEntry", "JournalEntry", "abc123", "pack");
      port.buildUuid("JournalEntry", "JournalEntry", "abc123");
      port.deepClone({ a: 1 });
      port.mergeObject({ a: 1 }, { b: 2 });
      port.mergeObject("not-an-object", { b: 2 });
      port.diffObject({ a: 1 }, { a: 2 });
      port.flattenObject({ a: { b: 1 } });
      port.expandObject({ ["a.b"]: 1 });
      port.cleanHTML("<script>alert(1)</script>");
      port.escapeHTML("<div>");
      port.unescapeHTML("&lt;div&gt;");
      await port.fetchWithTimeout("/api/data", {}, 5000);
      await port.fetchJsonWithTimeout("/api/data", {}, 5000);

      expect(parseUuidMock).toHaveBeenCalled();
      expect(buildUuidMock).toHaveBeenCalled();

      parseUuidMock.mockReturnValueOnce(null);
      const nullParseResult = port.parseUuid("JournalEntry.missing");
      expect(nullParseResult.ok).toBe(false);

      const internalApi = (port as unknown as { foundryAPI: IFoundryUtilsAPI }).foundryAPI;
      internalApi.buildUuid({
        id: "abc123",
        parent: { id: "parent-doc" },
      });

      vi.unstubAllGlobals();
    });

    it("should create port with null API when foundry.utils is not available", () => {
      vi.stubGlobal("foundry", undefined);

      const port = createFoundryUtilsPort();
      expect(port).toBeInstanceOf(FoundryUtilsPort);
      const id = port.randomID();
      expect(id).toMatch(/^fallback-/);

      vi.unstubAllGlobals();
    });
  });

  describe("DI Wrapper", () => {
    it("should create instance", () => {
      const diPort = new DIFoundryUtilsPort();
      expect(diPort).toBeInstanceOf(FoundryUtilsPort);
      // DI wrapper uses null API, will be replaced by factory during registration
      const id = diPort.randomID();
      expect(id).toMatch(/^fallback-/);
    });
  });
});

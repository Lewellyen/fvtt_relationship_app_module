import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryI18nService } from "../FoundryI18nService";
import type { FoundryI18n } from "@/foundry/interfaces/FoundryI18n";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/functional/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryI18nService", () => {
  let service: FoundryI18nService;
  let mockRegistry: PortRegistry<FoundryI18n>;
  let mockSelector: PortSelector;
  let mockPort: FoundryI18n;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      localize: vi.fn().mockReturnValue(ok("Translated")),
      format: vi.fn().mockReturnValue(ok("Formatted")),
      has: vi.fn().mockReturnValue(ok(true)),
    };

    mockRegistry = new PortRegistry<FoundryI18n>();
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    mockSelector = new PortSelector();
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    service = new FoundryI18nService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call using PortSelector", () => {
      const result = service.localize("TEST.KEY");
      expectResultOk(result);
      expect(mockSelector.selectPortFromFactories).toHaveBeenCalledOnce();
    });

    it("should cache resolved port", () => {
      service.localize("KEY1");
      service.localize("KEY2");
      service.format("KEY3", {});
      service.has("KEY4");

      // Port selection should only happen once (cached after first call)
      expect(mockSelector.selectPortFromFactories).toHaveBeenCalledOnce();
    });

    it("should propagate port selection errors", () => {
      const failingSelector = new PortSelector();
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryI18nService(failingSelector, mockRegistry);

      const result = failingService.localize("TEST.KEY");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("localize delegation", () => {
    it("should delegate to port", () => {
      mockPort.localize = vi.fn().mockReturnValue(ok("Translated Text"));

      const result = service.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("Translated Text");
      expect(mockPort.localize).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should propagate port errors", () => {
      const mockError = {
        code: "OPERATION_FAILED" as const,
        message: "Localize failed",
      };
      mockPort.localize = vi.fn().mockReturnValue(err(mockError));

      const result = service.localize("MODULE.TEST.KEY");

      expectResultErr(result);
      expect(result.error.message).toContain("Localize failed");
    });
  });

  describe("format delegation", () => {
    it("should delegate to port with data", () => {
      mockPort.format = vi.fn().mockReturnValue(ok("Welcome, Alice!"));

      const result = service.format("MODULE.WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("Welcome, Alice!");
      expect(mockPort.format).toHaveBeenCalledWith("MODULE.WELCOME", { name: "Alice" });
    });

    it("should handle port selection failure in format", () => {
      const failingSelector = new PortSelector();
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryI18nService(failingSelector, mockRegistry);

      const result = failingService.format("KEY", {});

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("has delegation", () => {
    it("should delegate to port", () => {
      mockPort.has = vi.fn().mockReturnValue(ok(true));

      const result = service.has("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe(true);
      expect(mockPort.has).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should return false when key does not exist", () => {
      mockPort.has = vi.fn().mockReturnValue(ok(false));

      const result = service.has("MODULE.UNKNOWN.KEY");

      expectResultOk(result);
      expect(result.value).toBe(false);
    });

    it("should handle port selection failure in has", () => {
      const failingSelector = new PortSelector();
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryI18nService(failingSelector, mockRegistry);

      const result = failingService.has("KEY");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("Dependencies", () => {
    it("should have correct static dependencies", () => {
      expect(FoundryI18nService.dependencies).toHaveLength(2);
      expect(FoundryI18nService.dependencies[0]).toBeDefined();
      expect(FoundryI18nService.dependencies[1]).toBeDefined();
    });
  });
});

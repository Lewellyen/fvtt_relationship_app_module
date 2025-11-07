import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundrySettingsService } from "../FoundrySettingsService";
import type { FoundrySettings, SettingConfig } from "@/foundry/interfaces/FoundrySettings";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/result";
import {
  expectResultOk,
  expectResultErr,
  createMockMetricsCollector,
  createMockLogger,
} from "@/test/utils/test-helpers";

describe("FoundrySettingsService", () => {
  let service: FoundrySettingsService;
  let mockRegistry: PortRegistry<FoundrySettings>;
  let mockSelector: PortSelector;
  let mockPort: FoundrySettings;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      register: vi.fn().mockReturnValue(ok(undefined)),
      get: vi.fn().mockReturnValue(ok(42)),
      set: vi.fn().mockResolvedValue(ok(undefined)),
    };

    mockRegistry = new PortRegistry<FoundrySettings>();
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    mockSelector = new PortSelector(createMockMetricsCollector(), createMockLogger());
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    service = new FoundrySettingsService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Port Selection (Lazy Loading)", () => {
    it("should lazy-load port on first method call", () => {
      const getFactoriesSpy = vi.spyOn(mockRegistry, "getFactories");
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromFactories");

      service.get("mod", "key");

      expect(getFactoriesSpy).toHaveBeenCalledOnce();
      expect(selectSpy).toHaveBeenCalledOnce();
    });

    it("should reuse port on subsequent calls", () => {
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromFactories");

      service.get("mod", "key1");
      service.get("mod", "key2");
      service.register("mod", "key3", {
        name: "Test",
        scope: "world",
        config: true,
        type: Number,
        default: 0,
      });

      // Should only select port once
      expect(selectSpy).toHaveBeenCalledOnce();
    });

    it("should handle port selection failure", () => {
      vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(
        err({ code: "PORT_SELECTION_FAILED", message: "No compatible port" })
      );

      const result = service.get("mod", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    });
  });

  describe("register()", () => {
    it("should delegate to port", () => {
      const config: SettingConfig<number> = {
        name: "Test",
        scope: "world",
        config: true,
        type: Number,
        default: 123,
      };

      const result = service.register("test-module", "testKey", config);

      expectResultOk(result);
      expect(mockPort.register).toHaveBeenCalledWith("test-module", "testKey", config);
    });
  });

  describe("get()", () => {
    it("should delegate to port", () => {
      const result = service.get<number>("test-module", "testKey");

      expectResultOk(result);
      expect(result.value).toBe(42);
      expect(mockPort.get).toHaveBeenCalledWith("test-module", "testKey");
    });
  });

  describe("set()", () => {
    it("should delegate to port", async () => {
      const result = await service.set("test-module", "testKey", 999);

      expectResultOk(result);
      expect(mockPort.set).toHaveBeenCalledWith("test-module", "testKey", 999);
    });
  });

  describe("dispose", () => {
    it("should reset port reference for garbage collection", () => {
      // Trigger port initialization
      service.get("test-module", "testKey");

      // Dispose should reset port
      service.dispose();

      // After dispose, port should be re-initialized on next call
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromFactories");
      service.get("test-module", "testKey");
      expect(selectSpy).toHaveBeenCalled();
    });
  });
});

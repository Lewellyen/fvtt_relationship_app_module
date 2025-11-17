/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundrySettingsService } from "../FoundrySettingsService";
import type { FoundrySettings, SettingConfig } from "@/foundry/interfaces/FoundrySettings";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/functional/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/observability/observability-registry";
import type { RetryService } from "@/services/RetryService";
import * as v from "valibot";

describe("FoundrySettingsService", () => {
  let service: FoundrySettingsService;
  let mockRegistry: PortRegistry<FoundrySettings>;
  let mockSelector: PortSelector;
  let mockPort: FoundrySettings;
  let mockRetryService: RetryService;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      register: vi.fn().mockReturnValue(ok(undefined)),
      get: vi.fn().mockReturnValue(ok(42)),
      set: vi.fn().mockResolvedValue(ok(undefined)),
    } as any;

    mockRegistry = new PortRegistry<FoundrySettings>();
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    const mockEventEmitter = new PortSelectionEventEmitter();
    const mockObservability: ObservabilityRegistry = {
      registerPortSelector: vi.fn(),
    } as any;
    mockSelector = new PortSelector(mockEventEmitter, mockObservability);
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    // Mock RetryService - just executes fn directly without retry logic
    mockRetryService = {
      retrySync: vi.fn((fn) => fn()),
      retry: vi.fn((fn) => fn()),
    } as any;

    service = new FoundrySettingsService(mockSelector, mockRegistry, mockRetryService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Port Selection (Lazy Loading)", () => {
    it("should lazy-load port on first method call", () => {
      const getFactoriesSpy = vi.spyOn(mockRegistry, "getFactories");
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromFactories");

      service.get("mod", "key", v.number());

      expect(getFactoriesSpy).toHaveBeenCalledOnce();
      expect(selectSpy).toHaveBeenCalledOnce();
    });

    it("should reuse port on subsequent calls", () => {
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromFactories");

      service.get("mod", "key1", v.number());
      service.get("mod", "key2", v.number());
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

      const result = service.get("mod", "key", v.number());

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

    it("should propagate port selection failure", () => {
      vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(
        err({ code: "PORT_SELECTION_FAILED", message: "No compatible port" })
      );

      const config: SettingConfig<number> = {
        name: "Test",
        scope: "world",
        config: true,
        type: Number,
        default: 123,
      };

      const result = service.register("test-module", "testKey", config);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    });
  });

  describe("get()", () => {
    it("should delegate to port", () => {
      const result = service.get<number>("test-module", "testKey", v.number());

      expectResultOk(result);
      expect(result.value).toBe(42);
      expect(mockPort.get).toHaveBeenCalled();
      expect(mockPort.get).toHaveBeenCalledTimes(1);
      // Verify port was called with correct arguments
      const calls = (mockPort.get as any).mock.calls;
      expect(calls[0][0]).toBe("test-module");
      expect(calls[0][1]).toBe("testKey");
      expect(calls[0][2]).toBeDefined(); // schema
    });
  });

  describe("set()", () => {
    it("should delegate to port", async () => {
      const result = await service.set("test-module", "testKey", 999);

      expectResultOk(result);
      expect(mockPort.set).toHaveBeenCalledWith("test-module", "testKey", 999);
    });

    it("should propagate port selection failure", async () => {
      vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(
        err({ code: "PORT_SELECTION_FAILED", message: "No compatible port" })
      );

      const result = await service.set("test-module", "testKey", 999);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    });
  });

  describe("dispose", () => {
    it("should reset port reference for garbage collection", () => {
      // Trigger port initialization
      service.get("test-module", "testKey", v.number());

      // Dispose should reset port
      service.dispose();

      // After dispose, port should be re-initialized on next call
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromFactories");
      service.get("test-module", "testKey", v.number());
      expect(selectSpy).toHaveBeenCalled();
    });
  });
});

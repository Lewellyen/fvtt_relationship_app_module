import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundrySettingsPort } from "@/infrastructure/adapters/foundry/services/FoundrySettingsPort";
import type {
  FoundrySettings,
  SettingConfig,
} from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { ok, err } from "@/domain/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { IPortSelectionObservability } from "@/infrastructure/adapters/foundry/versioning/port-selection-observability.interface";
import type { IPortSelectionPerformanceTracker } from "@/infrastructure/adapters/foundry/versioning/port-selection-performance-tracker.interface";
import type { PortSelectionObserver } from "@/infrastructure/adapters/foundry/versioning/port-selection-observer";
import type { PortSelectionEvent } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryVersionDetector } from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";
import { ok as resultOk } from "@/domain/utils/result";
import * as v from "valibot";

describe("FoundrySettingsPort", () => {
  let service: FoundrySettingsPort;
  let mockRegistry: PortRegistry<FoundrySettings>;
  let mockSelector: PortSelector;
  let mockPort: FoundrySettings;
  let mockRetryService: RetryService;
  let mockContainer: ServiceContainer;
  const mockToken = createInjectionToken<FoundrySettings>("mock-port");

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

    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === mockToken) return { ok: true, value: mockPort };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    mockRegistry = new PortRegistry<FoundrySettings>();
    vi.spyOn(mockRegistry, "getTokens").mockReturnValue(new Map([[13, mockToken]]));

    const mockVersionDetector: FoundryVersionDetector = {
      getVersion: vi.fn().mockReturnValue(resultOk(13)),
    } as any;
    const mockEventEmitter = new PortSelectionEventEmitter();
    const mockObservability: IPortSelectionObservability = {
      registerWithObservabilityRegistry: vi.fn(),
      setupObservability: vi.fn(),
    } as any;
    const mockPerformanceTracker: IPortSelectionPerformanceTracker = {
      startTracking: vi.fn(),
      endTracking: vi.fn().mockReturnValue(0),
    } as any;
    const mockObserver: PortSelectionObserver = {
      handleEvent: vi.fn((event: PortSelectionEvent) => {
        mockEventEmitter.emit(event);
      }),
    } as any;
    mockSelector = new PortSelector(
      mockVersionDetector,
      mockEventEmitter,
      mockObservability,
      mockPerformanceTracker,
      mockObserver,
      mockContainer
    );
    vi.spyOn(mockSelector, "selectPortFromTokens").mockReturnValue(ok(mockPort));

    // Mock RetryService - just executes fn directly without retry logic
    mockRetryService = {
      retrySync: vi.fn((fn) => fn()),
      retry: vi.fn((fn) => fn()),
    } as any;

    service = new FoundrySettingsPort(mockSelector, mockRegistry, mockRetryService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Port Selection (Lazy Loading)", () => {
    it("should lazy-load port on first method call", () => {
      const getTokensSpy = vi.spyOn(mockRegistry, "getTokens");
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromTokens");

      service.get("mod", "key", v.number());

      expect(getTokensSpy).toHaveBeenCalledOnce();
      expect(selectSpy).toHaveBeenCalledOnce();
    });

    it("should reuse port on subsequent calls", () => {
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromTokens");

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
      vi.spyOn(mockSelector, "selectPortFromTokens").mockReturnValue(
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
      vi.spyOn(mockSelector, "selectPortFromTokens").mockReturnValue(
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
      vi.spyOn(mockSelector, "selectPortFromTokens").mockReturnValue(
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
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromTokens");
      service.get("test-module", "testKey", v.number());
      expect(selectSpy).toHaveBeenCalled();
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FoundryI18nPort,
  DIFoundryI18nPort,
} from "@/infrastructure/adapters/foundry/services/FoundryI18nPort";
import type { FoundryI18n } from "@/infrastructure/adapters/foundry/interfaces/FoundryI18n";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { ok, err } from "@/infrastructure/shared/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";

describe("FoundryI18nPort", () => {
  let service: FoundryI18nPort;
  let mockRegistry: PortRegistry<FoundryI18n>;
  let mockSelector: PortSelector;
  let mockPort: FoundryI18n;
  let mockRetryService: RetryService;
  let mockContainer: ServiceContainer;
  const mockToken = createInjectionToken<FoundryI18n>("mock-port");

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      localize: vi.fn().mockReturnValue(ok("Translated")),
      format: vi.fn().mockReturnValue(ok("Formatted")),
      has: vi.fn().mockReturnValue(ok(true)),
      dispose: vi.fn(),
    };

    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === mockToken) return { ok: true, value: mockPort };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    mockRegistry = new PortRegistry<FoundryI18n>();
    vi.spyOn(mockRegistry, "getTokens").mockReturnValue(new Map([[13, mockToken]]));

    const mockEventEmitter = new PortSelectionEventEmitter();
    const mockObservability: ObservabilityRegistry = {
      registerPortSelector: vi.fn(),
    } as any;
    mockSelector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
    vi.spyOn(mockSelector, "selectPortFromTokens").mockReturnValue(ok(mockPort));

    // Mock RetryService - just executes fn directly without retry logic
    mockRetryService = {
      retrySync: vi.fn((fn) => fn()),
      retry: vi.fn((fn) => fn()),
    } as any;

    service = new FoundryI18nPort(mockSelector, mockRegistry, mockRetryService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call using PortSelector", () => {
      const result = service.localize("TEST.KEY");
      expectResultOk(result);
      expect(mockSelector.selectPortFromTokens).toHaveBeenCalledOnce();
    });

    it("should cache resolved port", () => {
      service.localize("KEY1");
      service.localize("KEY2");
      service.format("KEY3", {});
      service.has("KEY4");

      // Port selection should only happen once (cached after first call)
      expect(mockSelector.selectPortFromTokens).toHaveBeenCalledOnce();
    });

    it("should propagate port selection errors", () => {
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryI18nPort(failingSelector, mockRegistry, mockRetryService);

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
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryI18nPort(failingSelector, mockRegistry, mockRetryService);

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
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryI18nPort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.has("KEY");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("Dependencies", () => {
    it("should have correct static dependencies", () => {
      expect(DIFoundryI18nPort.dependencies).toHaveLength(3);
      expect(DIFoundryI18nPort.dependencies[0]).toBeDefined();
      expect(DIFoundryI18nPort.dependencies[1]).toBeDefined();
      expect(DIFoundryI18nPort.dependencies[2]).toBeDefined();
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryDocumentService } from "@/infrastructure/adapters/foundry/services/FoundryDocumentService";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
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
import * as v from "valibot";

describe("FoundryDocumentService", () => {
  let service: FoundryDocumentService;
  let mockRegistry: PortRegistry<FoundryDocument>;
  let mockSelector: PortSelector;
  let mockPort: FoundryDocument;
  let mockRetryService: RetryService;
  let mockContainer: ServiceContainer;
  const mockToken = createInjectionToken<FoundryDocument>("mock-port");

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      getFlag: vi.fn().mockReturnValue(ok(null)),
      setFlag: vi.fn().mockResolvedValue(ok(undefined)),
    } as any;

    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === mockToken) return { ok: true, value: mockPort };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    mockRegistry = new PortRegistry<FoundryDocument>();
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

    service = new FoundryDocumentService(mockSelector, mockRegistry, mockRetryService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call using PortSelector", () => {
      const document = { getFlag: vi.fn() };
      service.getFlag(document, "scope", "key", v.string());
      // Port should be successfully resolved
    });

    it("should cache resolved port", () => {
      const document = { getFlag: vi.fn() };
      const firstCall = service.getFlag(document, "scope", "key", v.string());
      const secondCall = service.getFlag(document, "scope", "key", v.string());

      expectResultOk(firstCall);
      expectResultOk(secondCall);
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
      const failingService = new FoundryDocumentService(
        failingSelector,
        mockRegistry,
        mockRetryService
      );

      const document = { getFlag: vi.fn() };
      const result = failingService.getFlag(document, "scope", "key", v.string());

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("getFlag delegation", () => {
    it("should delegate to port", () => {
      const document = { getFlag: vi.fn() };
      mockPort.getFlag = vi.fn().mockReturnValue(ok("value"));

      const result = service.getFlag(document, "scope", "key", v.string());

      expectResultOk(result);
      expect(result.value).toBe("value");
      expect(mockPort.getFlag).toHaveBeenCalled();
      // Verify port was called with correct arguments
      const calls = (mockPort.getFlag as any).mock.calls;
      expect(calls[0][0]).toBe(document);
      expect(calls[0][1]).toBe("scope");
      expect(calls[0][2]).toBe("key");
      expect(calls[0][3]).toBeDefined(); // schema
    });
  });

  describe("setFlag delegation", () => {
    it("should delegate to port async", async () => {
      const document = { setFlag: vi.fn() };
      mockPort.setFlag = vi.fn().mockResolvedValue(ok(undefined));

      const result = await service.setFlag(document, "scope", "key", "value");

      expectResultOk(result);
      expect(mockPort.setFlag).toHaveBeenCalledWith(document, "scope", "key", "value");
    });

    it("should handle async errors", async () => {
      const document = { setFlag: vi.fn() };
      const mockError = {
        code: "OPERATION_FAILED" as const,
        message: "Async error",
      };
      mockPort.setFlag = vi.fn().mockResolvedValue(err(mockError));

      const result = await service.setFlag(document, "scope", "key", "value");

      expectResultErr(result);
      expect(result.error.message).toContain("Async error");
    });
  });

  describe("Version Detection Failures", () => {
    it("should handle port selector errors", () => {
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "No compatible port found",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryDocumentService(
        failingSelector,
        mockRegistry,
        mockRetryService
      );

      const document = { getFlag: vi.fn() };
      const result = failingService.getFlag(document, "scope", "key", v.string());

      expectResultErr(result);
      expect(result.error.message).toContain("No compatible port");
    });
  });

  describe("dispose", () => {
    it("should reset port reference for garbage collection", () => {
      const document = { getFlag: vi.fn() };
      // Trigger port initialization
      service.getFlag(document, "scope", "key", v.string());

      // Dispose should reset port
      service.dispose();

      // After dispose, port should be re-initialized on next call
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromTokens");
      service.getFlag(document, "scope", "key", v.string());
      expect(selectSpy).toHaveBeenCalled();
    });
  });

  describe("Port Error Branches", () => {
    it("should handle port selection failure in setFlag", async () => {
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed in setFlag",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryDocumentService(
        failingSelector,
        mockRegistry,
        mockRetryService
      );

      const document = { setFlag: vi.fn() };
      const result = await failingService.setFlag(document, "scope", "key", "value");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });
});

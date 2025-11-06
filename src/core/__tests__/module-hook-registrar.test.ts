/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking container.resolve() responses

import { describe, it, expect, vi } from "vitest";
import { ModuleHookRegistrar } from "../module-hook-registrar";
import { createMockContainer } from "@/test/mocks/foundry";
import { MODULE_CONSTANTS } from "@/constants";
import { loggerToken, journalVisibilityServiceToken } from "@/tokens/tokenindex";
import { foundryHooksToken } from "@/foundry/foundrytokens";

describe("ModuleHookRegistrar", () => {
  describe("registerAll", () => {
    it("should resolve all required services and register hook", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      // Sollte alle Services auflösen via resolveWithError()
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(foundryHooksToken);
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(loggerToken);
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(journalVisibilityServiceToken);

      // Sollte Hook registrieren
      const hooksResult = mockContainer.resolveWithError(foundryHooksToken);
      const mockHooks = (hooksResult as any).value as any;
      expect(mockHooks.on).toHaveBeenCalledWith(
        MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
        expect.any(Function)
      );
    });

    it("should call processJournalDirectory when hook fires", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      // Hook-Callback extrahieren
      const hooksResult = mockContainer.resolveWithError(foundryHooksToken);
      const mockHooks = (hooksResult as any).value as any;
      const hooksOnMock = mockHooks.on as ReturnType<typeof vi.fn>;
      const hookCall = hooksOnMock.mock.calls.find(
        ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      );
      const hookCallback = hookCall?.[1] as ((app: unknown, html: HTMLElement) => void) | undefined;

      expect(hookCallback).toBeDefined();

      // Callback mit Mock-HTMLElement aufrufen
      const mockApp = {};
      const mockHtml = document.createElement("div");
      hookCallback!(mockApp, mockHtml);

      // processJournalDirectory sollte aufgerufen werden
      const journalResult = mockContainer.resolveWithError(journalVisibilityServiceToken);
      const mockJournalService = (journalResult as any).value as any;
      expect(mockJournalService.processJournalDirectory).toHaveBeenCalledWith(mockHtml);
    });

    it("should log debug message when hook fires", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hooksOnMock = mockHooks.on as ReturnType<typeof vi.fn>;
      const hookCall = hooksOnMock.mock.calls.find(
        ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      );
      const hookCallback = hookCall?.[1] as ((app: unknown, html: HTMLElement) => void) | undefined;

      const mockHtml = document.createElement("div");
      hookCallback!({}, mockHtml);

      const mockLogger = mockContainer.getMockLogger();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining(MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY)
      );
    });

    it("should log error when HTMLElement is invalid", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hooksOnMock = mockHooks.on as ReturnType<typeof vi.fn>;
      const hookCall = hooksOnMock.mock.calls.find(
        ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      );
      const hookCallback = hookCall?.[1] as ((app: unknown, html: unknown) => void) | undefined;

      // Callback mit null HTML aufrufen
      hookCallback!({}, null as unknown as HTMLElement);

      const mockLogger = mockContainer.getMockLogger();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to get HTMLElement from hook - incompatible format"
      );
    });

    it("should log error when hook registration fails", () => {
      const mockContainer = createMockContainer();
      const mockHooks = mockContainer.getMockHooks() as any;
      mockHooks.on.mockReturnValue({
        ok: false as const,
        error: { code: "OPERATION_FAILED", message: "Hook failed" },
      });

      const registrar = new ModuleHookRegistrar();
      registrar.registerAll(mockContainer as never);

      const mockLogger = mockContainer.getMockLogger();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to register"),
        expect.objectContaining({
          code: "OPERATION_FAILED",
        })
      );
    });
  });

  describe("jQuery compatibility", () => {
    it("should extract HTMLElement from jQuery object (numeric index)", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      expect(hookCallback).toBeDefined();

      // Simulate jQuery object
      const realElement = document.createElement("div");
      const jQueryMock: any = { length: 1 };
      jQueryMock[0] = realElement; // Numeric index assigned separately to avoid naming-convention lint error

      hookCallback({}, jQueryMock);

      const mockJournalService = mockContainer.getMockJournalService();
      expect(mockJournalService.processJournalDirectory).toHaveBeenCalledWith(realElement);
    });

    it("should extract HTMLElement from jQuery with .get() method", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      const realElement = document.createElement("div");
      const jQueryMock = {
        get: (index: number) => (index === 0 ? realElement : null),
      };

      hookCallback({}, jQueryMock);

      const mockJournalService = mockContainer.getMockJournalService();
      expect(mockJournalService.processJournalDirectory).toHaveBeenCalledWith(realElement);
    });

    it("should handle native HTMLElement (Foundry v13+)", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      const nativeElement = document.createElement("div");
      hookCallback({}, nativeElement);

      const mockJournalService = mockContainer.getMockJournalService();
      expect(mockJournalService.processJournalDirectory).toHaveBeenCalledWith(nativeElement);
    });

    it("should log error for invalid html argument", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      hookCallback({}, { invalid: "object" });

      const mockLogger = mockContainer.getMockLogger();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to get HTMLElement from hook")
      );
    });

    it("should handle errors when accessing journal entry properties", () => {
      const mockContainer = createMockContainer();
      const registrar = new ModuleHookRegistrar();

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      // Create an object with get() that throws
      const throwingJQuery = {
        get: () => {
          throw new Error("Property access failed");
        },
      };

      // Should not crash when accessing properties throws
      expect(() => {
        hookCallback({}, { element: [throwingJQuery] });
      }).not.toThrow();

      const mockLogger = mockContainer.getMockLogger();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to get HTMLElement from hook")
      );
    });
  });
});

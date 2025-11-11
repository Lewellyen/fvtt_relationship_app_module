/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking container.resolve() responses

import { describe, it, expect, vi } from "vitest";
import { ModuleHookRegistrar } from "../module-hook-registrar";
import { createMockContainer } from "@/test/mocks/foundry";
import { MODULE_CONSTANTS } from "@/constants";
import { loggerToken, journalVisibilityServiceToken } from "@/tokens/tokenindex";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import { RenderJournalDirectoryHook } from "@/core/hooks/render-journal-directory-hook";
import type { Logger } from "@/interfaces/logger";

// Create mock logger
function createMockLogger(): Logger {
  return {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    withTraceId: vi.fn().mockReturnThis(),
  };
}

describe("ModuleHookRegistrar", () => {
  describe("registerAll", () => {
    it("should resolve all required services and register hook", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

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
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

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
      const mockApp = { id: "journal-directory", object: {}, options: {} };
      const mockHtml = document.createElement("div");
      hookCallback!(mockApp, mockHtml);

      // processJournalDirectory sollte aufgerufen werden
      const journalResult = mockContainer.resolveWithError(journalVisibilityServiceToken);
      const mockJournalService = (journalResult as any).value as any;
      expect(mockJournalService.processJournalDirectory).toHaveBeenCalledWith(mockHtml);
    });

    it("should log debug message when hook fires", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hooksOnMock = mockHooks.on as ReturnType<typeof vi.fn>;
      const hookCall = hooksOnMock.mock.calls.find(
        ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      );
      const hookCallback = hookCall?.[1] as ((app: unknown, html: HTMLElement) => void) | undefined;

      const mockHtml = document.createElement("div");
      const mockApp = { id: "journal-directory", object: {}, options: {} };
      hookCallback!(mockApp, mockHtml);

      const containerLogger = mockContainer.getMockLogger();
      expect(containerLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining(MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY)
      );
    });

    it("should log error when HTMLElement is invalid", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hooksOnMock = mockHooks.on as ReturnType<typeof vi.fn>;
      const hookCall = hooksOnMock.mock.calls.find(
        ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      );
      const hookCallback = hookCall?.[1] as ((app: unknown, html: unknown) => void) | undefined;

      // Callback mit null HTML aufrufen
      const mockApp = { id: "journal-directory", object: {}, options: {} };
      hookCallback!(mockApp, null as unknown as HTMLElement);

      const containerLogger = mockContainer.getMockLogger();
      expect(containerLogger.error).toHaveBeenCalledWith(
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

      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);
      registrar.registerAll(mockContainer as never);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to register hook")
      );
    });
  });

  describe("app parameter validation", () => {
    it("should reject null app parameter", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      const mockHtml = document.createElement("div");
      hookCallback(null, mockHtml);

      const containerLogger = mockContainer.getMockLogger();
      expect(containerLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Invalid app parameter"),
        expect.any(Object)
      );

      // Should NOT process when app is invalid
      const mockJournalService = mockContainer.getMockJournalService();
      expect(mockJournalService.processJournalDirectory).not.toHaveBeenCalled();
    });

    it("should reject undefined app parameter", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      const mockHtml = document.createElement("div");
      hookCallback(undefined, mockHtml);

      const containerLogger = mockContainer.getMockLogger();
      expect(containerLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Invalid app parameter"),
        expect.any(Object)
      );
    });

    it("should reject app parameter without required id property", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      const invalidApp = { object: {}, options: {} }; // Missing 'id'
      const mockHtml = document.createElement("div");
      hookCallback(invalidApp, mockHtml);

      const containerLogger = mockContainer.getMockLogger();
      expect(containerLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Invalid app parameter"),
        expect.any(Object)
      );

      // Should NOT process when app is invalid
      const mockJournalService = mockContainer.getMockJournalService();
      expect(mockJournalService.processJournalDirectory).not.toHaveBeenCalled();
    });

    it("should accept valid app parameter", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      const validApp = { id: "journal-directory", object: {}, options: {} };
      const mockHtml = document.createElement("div");
      hookCallback(validApp, mockHtml);

      const containerLogger = mockContainer.getMockLogger();
      // Should NOT log app validation error
      expect(containerLogger.error).not.toHaveBeenCalledWith(
        expect.stringContaining("Invalid app parameter"),
        expect.any(Object)
      );

      // Should process when app is valid
      const mockJournalService = mockContainer.getMockJournalService();
      expect(mockJournalService.processJournalDirectory).toHaveBeenCalledWith(mockHtml);
    });
  });

  describe("HTML parameter validation", () => {
    it("should handle native HTMLElement", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      const nativeElement = document.createElement("div");
      const mockApp = { id: "journal-directory", object: {}, options: {} };
      hookCallback(mockApp, nativeElement);

      const mockJournalService = mockContainer.getMockJournalService();
      expect(mockJournalService.processJournalDirectory).toHaveBeenCalledWith(nativeElement);
    });

    it("should log error for invalid html argument", () => {
      const mockContainer = createMockContainer();
      const realHook = new RenderJournalDirectoryHook();
      const mockLogger = createMockLogger();
      const registrar = new ModuleHookRegistrar(realHook, mockLogger);

      registrar.registerAll(mockContainer as never);

      const mockHooks = mockContainer.getMockHooks() as any;
      const hookCallback = mockHooks.on.mock.calls.find(
        ([name]: [string]) => name === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1];

      const mockApp = { id: "journal-directory", object: {}, options: {} };
      hookCallback(mockApp, { invalid: "object" });

      const containerLogger = mockContainer.getMockLogger();
      expect(containerLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to get HTMLElement from hook")
      );
    });
  });
});

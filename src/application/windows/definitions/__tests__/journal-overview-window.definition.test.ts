import { describe, it, expect, beforeEach, vi } from "vitest";
import { createJournalOverviewWindowDefinition } from "../journal-overview-window.definition";
import type { ActionContext } from "@/domain/windows/types/action-definition.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { journalOverviewServiceToken } from "@/application/tokens/application.tokens";
import { ok, err } from "@/domain/utils/result";
import type { JournalOverviewService } from "@/application/services/JournalOverviewService";

describe("createJournalOverviewWindowDefinition", () => {
  let mockComponent: unknown;
  let mockController: IWindowController;
  let mockContainer: PlatformContainerPort;
  let mockService: JournalOverviewService;
  let context: ActionContext;

  beforeEach(() => {
    mockComponent = {};

    mockController = {
      updateStateLocal: vi.fn().mockResolvedValue(undefined),
    } as unknown as IWindowController;

    mockService = {
      getAllJournalsWithVisibilityStatus: vi.fn().mockReturnValue(
        ok([
          { id: "journal-1", name: "Journal 1", visible: true },
          { id: "journal-2", name: "Journal 2", visible: false },
        ])
      ),
    } as unknown as JournalOverviewService;

    mockContainer = {
      resolveWithError: vi.fn().mockReturnValue(ok(mockService)),
    } as unknown as PlatformContainerPort;

    context = {
      windowInstanceId: "test-window",
      state: {},
      metadata: {
        controller: mockController,
        container: mockContainer,
      },
    };
  });

  it("should create window definition with correct structure", () => {
    const definition = createJournalOverviewWindowDefinition(mockComponent);

    expect(definition.definitionId).toBe("journal-overview");
    expect(definition.title).toBe("Journal-Übersicht");
    expect(definition.icon).toBe("fas fa-list");
    expect(definition.component.type).toBe("svelte");
    expect(definition.component.component).toBe(mockComponent);
    expect(definition.features?.resizable).toBe(true);
    expect(definition.features?.minimizable).toBe(true);
    expect(definition.features?.draggable).toBe(true);
    expect(definition.features?.closable).toBe(true);
    expect(definition.position?.width).toBe(800);
    expect(definition.position?.height).toBe(600);
    expect(definition.position?.centered).toBe(true);
    expect(definition.actions).toHaveLength(1);
    expect(definition.actions?.[0]?.id).toBe("onOpen");
    expect(typeof definition.actions?.[0]?.handler).toBe("function");
  });

  describe("onOpen handler", () => {
    it("should load journals successfully", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const handler = definition.actions?.[0]?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(journalOverviewServiceToken);
      expect(mockService.getAllJournalsWithVisibilityStatus).toHaveBeenCalled();
      expect(mockController.updateStateLocal).toHaveBeenCalledTimes(2);
      expect(mockController.updateStateLocal).toHaveBeenNthCalledWith(1, {
        isLoading: true,
        error: null,
      });
      expect(mockController.updateStateLocal).toHaveBeenNthCalledWith(2, {
        isLoading: false,
        error: null,
        journals: [
          { id: "journal-1", name: "Journal 1", visible: true },
          { id: "journal-2", name: "Journal 2", visible: false },
        ],
      });
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const handler = definition.actions?.[0]?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const contextWithoutController: ActionContext = {
        ...context,
        metadata: {
          container: mockContainer,
        },
      };

      const result = await handler(contextWithoutController);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidContext");
        expect(result.error.message).toBe("Controller not found in context");
      }
      expect(mockController.updateStateLocal).not.toHaveBeenCalled();
    });

    it("should return error when container is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const handler = definition.actions?.[0]?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const contextWithoutContainer: ActionContext = {
        ...context,
        metadata: {
          controller: mockController,
        },
      };

      const result = await handler(contextWithoutContainer);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidContext");
        expect(result.error.message).toBe("Container not found in context");
      }
      expect(mockController.updateStateLocal).not.toHaveBeenCalled();
    });

    it("should return error when service cannot be resolved", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const handler = definition.actions?.[0]?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      vi.mocked(mockContainer.resolveWithError).mockReturnValue(
        err({
          code: "TokenNotRegistered",
          message: "Service not found",
          tokenDescription: String(journalOverviewServiceToken),
        })
      );

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ServiceNotFound");
        expect(result.error.message).toContain("Failed to resolve JournalOverviewService");
      }
      expect(mockController.updateStateLocal).toHaveBeenCalledTimes(2);
      expect(mockController.updateStateLocal).toHaveBeenNthCalledWith(1, {
        isLoading: true,
        error: null,
      });
      expect(mockController.updateStateLocal).toHaveBeenNthCalledWith(2, {
        isLoading: false,
        error: "Failed to resolve JournalOverviewService: Service not found",
      });
      expect(mockService.getAllJournalsWithVisibilityStatus).not.toHaveBeenCalled();
    });

    it("should return error when getAllJournalsWithVisibilityStatus fails", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const handler = definition.actions?.[0]?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockReturnValue(
        err(new Error("Failed to load journals"))
      );

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("LoadFailed");
        expect(result.error.message).toBe("Failed to load journals");
      }
      expect(mockController.updateStateLocal).toHaveBeenCalledTimes(2);
      expect(mockController.updateStateLocal).toHaveBeenNthCalledWith(1, {
        isLoading: true,
        error: null,
      });
      expect(mockController.updateStateLocal).toHaveBeenNthCalledWith(2, {
        isLoading: false,
        error: "Failed to load journals",
      });
    });

    it("should handle unexpected errors", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const handler = definition.actions?.[0]?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("Unexpected error");
      }
    });

    it("should handle non-Error exceptions", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const handler = definition.actions?.[0]?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockImplementation(() => {
        throw "String error";
      });

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("String error");
      }
    });
  });
});

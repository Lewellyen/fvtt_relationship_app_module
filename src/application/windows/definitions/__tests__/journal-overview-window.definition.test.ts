import { describe, it, expect, beforeEach, vi } from "vitest";
import { createJournalOverviewWindowDefinition } from "../journal-overview-window.definition";
import type { ActionContext } from "@/domain/windows/types/action-definition.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import {
  journalOverviewServiceToken,
  journalDirectoryRerenderSchedulerToken,
} from "@/application/tokens/application.tokens";
import {
  platformJournalRepositoryToken,
  cacheInvalidationPortToken,
  platformUIPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { ok, err } from "@/domain/utils/result";
import type { JournalOverviewService } from "@/application/services/JournalOverviewService";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { CacheInvalidationPort } from "@/domain/ports/cache/cache-invalidation-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalDirectoryRerenderScheduler } from "@/application/services/JournalDirectoryRerenderScheduler";
import { HIDDEN_JOURNAL_CACHE_TAG } from "@/application/services/JournalVisibilityService";
import type { DomainCacheEntryMetadata, DomainCacheKey } from "@/domain/types/cache/cache-types";

describe("createJournalOverviewWindowDefinition", () => {
  let mockComponent: unknown;
  let mockController: IWindowController;
  let mockContainer: PlatformContainerPort;
  let mockService: JournalOverviewService;
  let context: ActionContext;

  beforeEach(() => {
    mockComponent = {};

    const mockState: Record<string, unknown> = {};
    mockController = {
      updateStateLocal: vi.fn().mockImplementation(async (updates: Record<string, unknown>) => {
        Object.assign(mockState, updates);
        return undefined;
      }),
      dispatchAction: vi.fn().mockResolvedValue(ok(undefined)),
      get state() {
        return mockState as Readonly<Record<string, unknown>>;
      },
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
    expect(definition.actions).toHaveLength(10);
    const onOpenAction = definition.actions?.find((a) => a.id === "onOpen");
    expect(onOpenAction).toBeDefined();
    expect(typeof onOpenAction?.handler).toBe("function");
  });

  describe("onOpen handler", () => {
    it("should load journals successfully", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const onOpenAction = definition.actions?.find((a) => a.id === "onOpen");
      const handler = onOpenAction?.handler;
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
        sortColumn: null,
        sortDirection: "asc",
        columnFilters: {},
        globalSearch: "",
      });
      expect(mockController.dispatchAction).toHaveBeenCalledWith("applyFilters");
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const onOpenAction = definition.actions?.find((a) => a.id === "onOpen");
      const handler = onOpenAction?.handler;
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
      const onOpenAction = definition.actions?.find((a) => a.id === "onOpen");
      const handler = onOpenAction?.handler;
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
      const onOpenAction = definition.actions?.find((a) => a.id === "onOpen");
      const handler = onOpenAction?.handler;
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
      const onOpenAction = definition.actions?.find((a) => a.id === "onOpen");
      const handler = onOpenAction?.handler;
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
      const onOpenAction = definition.actions?.find((a) => a.id === "onOpen");
      const handler = onOpenAction?.handler;
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
      const onOpenAction = definition.actions?.find((a) => a.id === "onOpen");
      const handler = onOpenAction?.handler;
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

  describe("toggleJournalVisibility handler", () => {
    let mockRepository: PlatformJournalRepository;
    let mockCache: CacheInvalidationPort;
    let mockScheduler: JournalDirectoryRerenderScheduler;

    beforeEach(() => {
      mockRepository = {
        setFlag: vi.fn().mockResolvedValue(ok(undefined)),
        unsetFlag: vi.fn().mockResolvedValue(ok(undefined)),
      } as unknown as PlatformJournalRepository;

      mockCache = {
        invalidateWhere: vi.fn(),
      } as unknown as CacheInvalidationPort;

      mockScheduler = {
        requestRerender: vi.fn(),
      } as unknown as JournalDirectoryRerenderScheduler;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === cacheInvalidationPortToken) {
          return ok(mockCache);
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok(mockScheduler);
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      // Set initial state with journals
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal 1", isHidden: false },
          { id: "journal-2", name: "Journal 2", isHidden: true },
        ],
      });
    });

    it("should toggle journal visibility successfully", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockRepository.setFlag).toHaveBeenCalled();
      expect(mockCache.invalidateWhere).toHaveBeenCalled();
      expect(mockScheduler.requestRerender).toHaveBeenCalled();

      // Test that the arrow function passed to invalidateWhere is executed
      const invalidateWhereCall = vi.mocked(mockCache.invalidateWhere).mock.calls[0];
      expect(invalidateWhereCall).toBeDefined();
      if (invalidateWhereCall && invalidateWhereCall[0]) {
        const predicate = invalidateWhereCall[0];
        // Test with metadata that includes the cache tag
        const metadataWithTag: DomainCacheEntryMetadata = {
          key: "test-key" as DomainCacheKey,
          createdAt: 0,
          expiresAt: null,
          lastAccessedAt: 0,
          hits: 0,
          tags: [HIDDEN_JOURNAL_CACHE_TAG],
        };
        expect(predicate(metadataWithTag)).toBe(true);
        // Test with metadata that doesn't include the cache tag
        const metadataWithoutTag: DomainCacheEntryMetadata = {
          key: "test-key" as DomainCacheKey,
          createdAt: 0,
          expiresAt: null,
          lastAccessedAt: 0,
          hits: 0,
          tags: ["other-tag"],
        };
        expect(predicate(metadataWithoutTag)).toBe(false);
      }
    });

    it("should toggle hidden journal to visible successfully", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-2", // journal-2 is hidden, so unsetFlag will be called
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).toHaveBeenCalled();
      expect(mockCache.invalidateWhere).toHaveBeenCalled();
      expect(mockScheduler.requestRerender).toHaveBeenCalled();
    });

    it("should return error when journalId is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidParameter");
        expect(result.error.message).toBe("journalId not provided in metadata");
      }
    });

    it("should return error when journal not found", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "non-existent",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("JournalNotFound");
      }
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
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
        expect(result.error.message).toBe("Controller or container not found in context");
      }
    });

    it("should return error when container is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
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
        expect(result.error.message).toBe("Controller or container not found in context");
      }
    });

    it("should return error when repository cannot be resolved", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return err({
            code: "TokenNotRegistered",
            message: "Repository not found",
            tokenDescription: String(token),
          });
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ServiceNotFound");
        expect(result.error.message).toContain("Failed to resolve PlatformJournalRepository");
      }
    });

    it("should return error when setFlag fails", async () => {
      vi.mocked(mockRepository.setFlag).mockResolvedValueOnce(
        err({ code: "OPERATION_FAILED", message: "Failed to set flag" })
      );

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ToggleFailed");
        expect(result.error.message).toBe("Failed to set flag");
      }
    });

    it("should return error when unsetFlag fails", async () => {
      vi.mocked(mockRepository.unsetFlag).mockResolvedValueOnce(
        err({ code: "OPERATION_FAILED", message: "Failed to unset flag" })
      );

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-2", // journal-2 is hidden, so unsetFlag will be called
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ToggleFailed");
        expect(result.error.message).toBe("Failed to unset flag");
      }
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(mockRepository.setFlag).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("Unexpected error");
      }
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(mockRepository.setFlag).mockImplementation(() => {
        throw "String error";
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("String error");
      }
    });

    it("should handle when journals is not an array", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: null,
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("JournalNotFound");
      }
    });

    it("should handle when cache resolution fails", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === cacheInvalidationPortToken) {
          return err({
            code: "TokenNotRegistered",
            message: "Cache not found",
            tokenDescription: String(token),
          });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok(mockScheduler);
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockRepository.setFlag).toHaveBeenCalled();
      // Cache invalidateWhere should not be called when cache resolution fails
    });

    it("should handle when scheduler resolution fails", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === cacheInvalidationPortToken) {
          return ok(mockCache);
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return err({
            code: "TokenNotRegistered",
            message: "Scheduler not found",
            tokenDescription: String(token),
          });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockRepository.setFlag).toHaveBeenCalled();
      // Scheduler requestRerender should not be called when scheduler resolution fails
    });

    it("should handle when service reload fails", async () => {
      // Reset mock to return error for the reload call
      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockReset();
      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockReturnValue(
        err(new Error("Reload failed"))
      );

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockRepository.setFlag).toHaveBeenCalled();
      expect(mockService.getAllJournalsWithVisibilityStatus).toHaveBeenCalled();
      // State should not be updated when reload fails
    });

    it("should handle when service cannot be resolved for reload", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === cacheInvalidationPortToken) {
          return ok(mockCache);
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok(mockScheduler);
        }
        if (token === journalOverviewServiceToken) {
          // Service resolution fails for reload
          return err({
            code: "TokenNotRegistered",
            message: "Service not found for reload",
            tokenDescription: String(token),
          });
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleJournalVisibility");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          journalId: "journal-1",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockRepository.setFlag).toHaveBeenCalled();
      // State should not be updated when service cannot be resolved for reload
    });
  });

  describe("setSort handler", () => {
    beforeEach(() => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        sortColumn: null,
        sortDirection: "asc",
      });
    });

    it("should set sort column successfully", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setSort");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "asc",
      });
      expect(mockController.dispatchAction).toHaveBeenCalledWith("applyFilters");
    });

    it("should toggle sort direction when same column clicked", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        sortColumn: "name",
        sortDirection: "asc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setSort");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "desc",
      });
    });

    it("should cycle back to asc when same column clicked third time", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        sortColumn: "name",
        sortDirection: "desc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setSort");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "asc",
      });
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setSort");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const contextWithoutController: ActionContext = {
        ...context,
        metadata: {},
      };

      const result = await handler(contextWithoutController);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidContext");
        expect(result.error.message).toBe("Controller not found in context");
      }
    });

    it("should return error when column is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setSort");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidParameter");
        expect(result.error.message).toBe("column not provided in metadata");
      }
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(mockController.updateStateLocal).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setSort");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
      }
    });

    it("should use default sortDirection when not set", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        sortColumn: null,
        sortDirection: undefined,
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setSort");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "asc",
      });
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(mockController.updateStateLocal).mockImplementation(() => {
        throw "String error";
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setSort");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("String error");
      }
    });
  });

  describe("setColumnFilter handler", () => {
    beforeEach(() => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        columnFilters: {},
      });
    });

    it("should set column filter successfully", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setColumnFilter");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
          value: "test",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        columnFilters: { name: "test" },
      });
      expect(mockController.dispatchAction).toHaveBeenCalledWith("applyFilters");
    });

    it("should remove filter when value is empty", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        columnFilters: { name: "existing" },
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setColumnFilter");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
          value: "",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        columnFilters: {},
      });
    });

    it("should return error when column is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setColumnFilter");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidParameter");
        expect(result.error.message).toBe("column not provided in metadata");
      }
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setColumnFilter");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const contextWithoutController: ActionContext = {
        ...context,
        metadata: {},
      };

      const result = await handler(contextWithoutController);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidContext");
        expect(result.error.message).toBe("Controller not found in context");
      }
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(mockController.updateStateLocal).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setColumnFilter");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
          value: "test",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
      }
    });

    it("should use default columnFilters when not set", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        columnFilters: undefined,
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setColumnFilter");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
          value: "test",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        columnFilters: { name: "test" },
      });
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(mockController.updateStateLocal).mockImplementation(() => {
        throw "String error";
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setColumnFilter");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          column: "name",
          value: "test",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("String error");
      }
    });
  });

  describe("setGlobalSearch handler", () => {
    it("should set global search successfully", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setGlobalSearch");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          value: "search term",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        globalSearch: "search term",
      });
      expect(mockController.dispatchAction).toHaveBeenCalledWith("applyFilters");
    });

    it("should set empty string when value is undefined", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setGlobalSearch");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        globalSearch: "",
      });
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setGlobalSearch");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const contextWithoutController: ActionContext = {
        ...context,
        metadata: {},
      };

      const result = await handler(contextWithoutController);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidContext");
        expect(result.error.message).toBe("Controller not found in context");
      }
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(mockController.updateStateLocal).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setGlobalSearch");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          value: "test",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
      }
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(mockController.updateStateLocal).mockImplementation(() => {
        throw "String error";
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setGlobalSearch");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const testContext: ActionContext = {
        ...context,
        metadata: {
          ...context.metadata,
          value: "test",
        },
      };

      const result = await handler(testContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("String error");
      }
    });
  });

  describe("applyFilters handler", () => {
    beforeEach(() => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal 1", isHidden: false },
          { id: "journal-2", name: "Journal 2", isHidden: true },
        ],
        globalSearch: "",
        columnFilters: {},
        sortColumn: null,
        sortDirection: "asc",
      });
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const contextWithoutController: ActionContext = {
        ...context,
        metadata: {},
      };

      const result = await handler(contextWithoutController);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidContext");
        expect(result.error.message).toBe("Controller not found in context");
      }
    });

    it("should apply filters and update filteredJournals", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        filteredJournals: expect.arrayContaining([
          expect.objectContaining({ id: "journal-1" }),
          expect.objectContaining({ id: "journal-2" }),
        ]),
      });
    });

    it("should filter by global search", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        globalSearch: "Journal 1",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      expect(updateCall).toBeDefined();
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe("journal-1");
      }
    });

    it("should filter by column filter name", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        columnFilters: { name: "Journal 1" },
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe("journal-1");
      }
    });

    it("should filter by column filter status", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        columnFilters: { status: "versteckt" },
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe("journal-2");
      }
    });

    it("should sort by name ascending", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-2", name: "Z Journal", isHidden: false },
          { id: "journal-1", name: "A Journal", isHidden: false },
        ],
        sortColumn: "name",
        sortDirection: "asc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered[0]?.id).toBe("journal-1");
        expect(filtered[1]?.id).toBe("journal-2");
      }
    });

    it("should sort by name descending", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "A Journal", isHidden: false },
          { id: "journal-2", name: "Z Journal", isHidden: false },
        ],
        sortColumn: "name",
        sortDirection: "desc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered[0]?.id).toBe("journal-2");
        expect(filtered[1]?.id).toBe("journal-1");
      }
    });

    it("should sort by status", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal 1", isHidden: false },
          { id: "journal-2", name: "Journal 2", isHidden: true },
        ],
        sortColumn: "status",
        sortDirection: "asc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string; isHidden: boolean }>;
        expect(filtered[0]?.isHidden).toBe(false);
        expect(filtered[1]?.isHidden).toBe(true);
      }
    });

    it("should handle unknown sort column", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal 1", isHidden: false },
          { id: "journal-2", name: "Journal 2", isHidden: true },
        ],
        sortColumn: "unknown",
        sortDirection: "asc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      // Should not change order when sortColumn is unknown
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      expect(updateCall).toBeDefined();
    });

    it("should handle equal values in sort", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal", isHidden: false },
          { id: "journal-2", name: "Journal", isHidden: false },
        ],
        sortColumn: "name",
        sortDirection: "asc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      expect(updateCall).toBeDefined();
    });

    it("should handle empty journals array", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [],
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        filteredJournals: [],
      });
    });

    it("should handle non-array journals", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: null,
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        filteredJournals: [],
      });
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(mockController.updateStateLocal).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
      }
    });

    it("should filter journals without name (using id as fallback)", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal 1", isHidden: false },
          { id: "journal-2", isHidden: false }, // No name
        ],
        globalSearch: "journal-2",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe("journal-2");
      }
    });

    it("should filter by column filter name using id as fallback", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal 1", isHidden: false },
          { id: "journal-2", isHidden: false }, // No name
        ],
        columnFilters: { name: "journal-2" },
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe("journal-2");
      }
    });

    it("should sort by name using id as fallback", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-z", isHidden: false }, // No name, uses id
          { id: "journal-a", name: "A Journal", isHidden: false },
        ],
        sortColumn: "name",
        sortDirection: "asc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered[0]?.id).toBe("journal-a");
        expect(filtered[1]?.id).toBe("journal-z");
      }
    });

    it("should sort by name using id as fallback for both a and b", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-z", isHidden: false }, // No name, uses id
          { id: "journal-a", isHidden: false }, // No name, uses id
        ],
        sortColumn: "name",
        sortDirection: "asc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        expect(filtered[0]?.id).toBe("journal-a");
        expect(filtered[1]?.id).toBe("journal-z");
      }
    });

    it("should sort by status descending", async () => {
      // Start with journals in ascending order (visible first) to force the sort function
      // to call the compare function with aVal < bVal when sorting descending
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal 1", isHidden: false }, // aVal = 0
          { id: "journal-2", name: "Journal 2", isHidden: false }, // aVal = 0
          { id: "journal-3", name: "Journal 3", isHidden: true }, // aVal = 1
          { id: "journal-4", name: "Journal 4", isHidden: true }, // aVal = 1
        ],
        sortColumn: "status",
        sortDirection: "desc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string; isHidden: boolean }>;
        // With desc direction, hidden (isHidden: true, value 1) should come before visible (isHidden: false, value 0)
        expect(filtered[0]?.isHidden).toBe(true);
        expect(filtered[1]?.isHidden).toBe(true);
        expect(filtered[2]?.isHidden).toBe(false);
        expect(filtered[3]?.isHidden).toBe(false);
      }
    });

    it("should sort by status with both visible and hidden journals", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "Journal 1", isHidden: true },
          { id: "journal-2", name: "Journal 2", isHidden: false },
          { id: "journal-3", name: "Journal 3", isHidden: false },
          { id: "journal-4", name: "Journal 4", isHidden: true },
        ],
        sortColumn: "status",
        sortDirection: "asc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string; isHidden: boolean }>;
        // All visible (isHidden: false) should come first, then hidden (isHidden: true)
        expect(filtered[0]?.isHidden).toBe(false);
        expect(filtered[1]?.isHidden).toBe(false);
        expect(filtered[2]?.isHidden).toBe(true);
        expect(filtered[3]?.isHidden).toBe(true);
      }
    });

    it("should use default values when state properties are missing", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [{ id: "journal-1", name: "Journal 1", isHidden: false }],
        globalSearch: undefined,
        columnFilters: undefined,
        sortDirection: undefined,
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockController.updateStateLocal).toHaveBeenCalled();
    });

    it("should handle sort with aVal < bVal and desc direction", async () => {
      // Use multiple journals to ensure the sort function compares elements
      // where aVal < bVal is true with desc direction
      // Start with elements in ascending order to force comparisons
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        journals: [
          { id: "journal-1", name: "A Journal", isHidden: false },
          { id: "journal-2", name: "B Journal", isHidden: false },
          { id: "journal-3", name: "C Journal", isHidden: false },
          { id: "journal-4", name: "D Journal", isHidden: false },
          { id: "journal-5", name: "E Journal", isHidden: false },
          { id: "journal-6", name: "Z Journal", isHidden: false },
        ],
        sortColumn: "name",
        sortDirection: "desc",
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      const updateCall = vi
        .mocked(mockController.updateStateLocal)
        .mock.calls.find((call) => call[0].filteredJournals);
      if (updateCall && updateCall[0]?.filteredJournals) {
        const filtered = updateCall[0].filteredJournals as Array<{ id: string }>;
        // With desc direction, Z should come first, then E, D, C, B, A
        expect(filtered[0]?.id).toBe("journal-6");
        expect(filtered[1]?.id).toBe("journal-5");
        expect(filtered[2]?.id).toBe("journal-4");
        expect(filtered[3]?.id).toBe("journal-3");
        expect(filtered[4]?.id).toBe("journal-2");
        expect(filtered[5]?.id).toBe("journal-1");
      }
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(mockController.updateStateLocal).mockImplementation(() => {
        throw "String error";
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "applyFilters");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("String error");
      }
    });
  });

  describe("refreshData handler", () => {
    it("should refresh data successfully", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "refreshData");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(journalOverviewServiceToken);
      expect(mockService.getAllJournalsWithVisibilityStatus).toHaveBeenCalled();
      expect(mockController.updateStateLocal).toHaveBeenCalledWith({
        journals: [
          { id: "journal-1", name: "Journal 1", visible: true },
          { id: "journal-2", name: "Journal 2", visible: false },
        ],
      });
      expect(mockController.dispatchAction).toHaveBeenCalledWith("applyFilters");
    });

    it("should return error when service cannot be resolved", async () => {
      vi.mocked(mockContainer.resolveWithError).mockReturnValue(
        err({
          code: "TokenNotRegistered",
          message: "Service not found",
          tokenDescription: String(journalOverviewServiceToken),
        })
      );

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "refreshData");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ServiceNotFound");
      }
    });

    it("should return error when getAllJournalsWithVisibilityStatus fails", async () => {
      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockReturnValue(
        err(new Error("Failed to load"))
      );

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "refreshData");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("LoadFailed");
      }
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "refreshData");
      const handler = action?.handler;
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
        expect(result.error.message).toBe("Controller or container not found in context");
      }
    });

    it("should return error when container is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "refreshData");
      const handler = action?.handler;
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
        expect(result.error.message).toBe("Controller or container not found in context");
      }
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "refreshData");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
      }
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockImplementation(() => {
        throw "String error";
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "refreshData");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("String error");
      }
    });
  });

  describe("setAllVisible handler", () => {
    let mockRepository: PlatformJournalRepository;
    let mockUI: PlatformUIPort;
    let mockCache: CacheInvalidationPort;

    beforeEach(() => {
      mockRepository = {
        setFlag: vi.fn().mockResolvedValue(ok(undefined)),
        unsetFlag: vi.fn().mockResolvedValue(ok(undefined)),
      } as unknown as PlatformJournalRepository;

      mockUI = {
        notify: vi.fn(),
      } as unknown as PlatformUIPort;

      mockCache = {
        invalidateWhere: vi.fn(),
      } as unknown as CacheInvalidationPort;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok(mockUI);
        }
        if (token === cacheInvalidationPortToken) {
          return ok(mockCache);
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        filteredJournals: [
          { id: "journal-1", name: "Journal 1", isHidden: true },
          { id: "journal-2", name: "Journal 2", isHidden: true },
        ],
      });
    });

    it("should set all journals visible", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).toHaveBeenCalledTimes(2);
      expect(mockCache.invalidateWhere).toHaveBeenCalled();

      // Test that the arrow function passed to invalidateWhere is executed
      const invalidateWhereCall = vi.mocked(mockCache.invalidateWhere).mock.calls[0];
      expect(invalidateWhereCall).toBeDefined();
      if (invalidateWhereCall && invalidateWhereCall[0]) {
        const predicate = invalidateWhereCall[0];
        // Test with metadata that includes the cache tag
        const metadataWithTag: DomainCacheEntryMetadata = {
          key: "test-key" as DomainCacheKey,
          createdAt: 0,
          expiresAt: null,
          lastAccessedAt: 0,
          hits: 0,
          tags: [HIDDEN_JOURNAL_CACHE_TAG],
        };
        expect(predicate(metadataWithTag)).toBe(true);
        // Test with metadata that doesn't include the cache tag
        const metadataWithoutTag: DomainCacheEntryMetadata = {
          key: "test-key" as DomainCacheKey,
          createdAt: 0,
          expiresAt: null,
          lastAccessedAt: 0,
          hits: 0,
          tags: ["other-tag"],
        };
        expect(predicate(metadataWithoutTag)).toBe(false);
      }
    });

    it("should return ok when no filtered journals", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        filteredJournals: [],
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).not.toHaveBeenCalled();
    });

    it("should handle repository errors and show notification", async () => {
      const mockNotifications: NotificationPublisherPort = {
        warn: vi.fn(),
      } as unknown as NotificationPublisherPort;

      vi.mocked(mockRepository.unsetFlag).mockResolvedValueOnce(
        err({ code: "OPERATION_FAILED", message: "Failed" })
      );

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok(mockUI);
        }
        if (token === notificationPublisherPortToken) {
          return ok(mockNotifications);
        }
        if (token === cacheInvalidationPortToken) {
          return ok({ invalidateWhere: vi.fn() });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).toHaveBeenCalled();
    });

    it("should handle repository errors when notifications cannot be resolved", async () => {
      vi.mocked(mockRepository.unsetFlag).mockResolvedValueOnce(
        err({ code: "OPERATION_FAILED", message: "Failed" })
      );

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok(mockUI);
        }
        if (token === notificationPublisherPortToken) {
          return err({
            code: "TokenNotRegistered",
            message: "Notifications not found",
            tokenDescription: String(token),
          });
        }
        if (token === cacheInvalidationPortToken) {
          return ok({ invalidateWhere: vi.fn() });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).toHaveBeenCalled();
      // notifications.warn should not be called when notifications cannot be resolved
    });

    it("should return error when controller is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
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
        expect(result.error.message).toBe("Controller or container not found in context");
      }
    });

    it("should return error when container is missing", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
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
        expect(result.error.message).toBe("Controller or container not found in context");
      }
    });

    it("should return error when repository cannot be resolved", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return err({
            code: "TokenNotRegistered",
            message: "Repository not found",
            tokenDescription: String(token),
          });
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ServiceNotFound");
        expect(result.error.message).toContain("Failed to resolve PlatformJournalRepository");
      }
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(mockRepository.unsetFlag).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
      }
    });

    it("should handle when filteredJournals is not an array", async () => {
      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        filteredJournals: null,
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).not.toHaveBeenCalled();
    });

    it("should handle when UI resolution fails", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return err({
            code: "TokenNotRegistered",
            message: "UI not found",
            tokenDescription: String(token),
          });
        }
        if (token === notificationPublisherPortToken) {
          return ok({ warn: vi.fn() });
        }
        if (token === cacheInvalidationPortToken) {
          return ok({ invalidateWhere: vi.fn() });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).toHaveBeenCalled();
      // UI notify should not be called when UI resolution fails
    });

    it("should handle when cache resolution fails in bulk operation", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok(mockUI);
        }
        if (token === notificationPublisherPortToken) {
          return ok({ warn: vi.fn() });
        }
        if (token === cacheInvalidationPortToken) {
          return err({
            code: "TokenNotRegistered",
            message: "Cache not found",
            tokenDescription: String(token),
          });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).toHaveBeenCalled();
      // Cache invalidateWhere should not be called when cache resolution fails
    });

    it("should handle when scheduler resolution fails in bulk operation", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok(mockUI);
        }
        if (token === notificationPublisherPortToken) {
          return ok({ warn: vi.fn() });
        }
        if (token === cacheInvalidationPortToken) {
          return ok({ invalidateWhere: vi.fn() });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return err({
            code: "TokenNotRegistered",
            message: "Scheduler not found",
            tokenDescription: String(token),
          });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).toHaveBeenCalled();
      // Scheduler requestRerender should not be called when scheduler resolution fails
    });

    it("should handle when service reload fails in bulk operation", async () => {
      // Reset mock to return error for the reload call
      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockReset();
      vi.mocked(mockService.getAllJournalsWithVisibilityStatus).mockReturnValue(
        err(new Error("Reload failed"))
      );

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).toHaveBeenCalled();
      expect(mockService.getAllJournalsWithVisibilityStatus).toHaveBeenCalled();
      // State should not be updated when reload fails
    });

    it("should handle when service cannot be resolved for reload in bulk operation", async () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok(mockUI);
        }
        if (token === notificationPublisherPortToken) {
          return ok({ warn: vi.fn() });
        }
        if (token === cacheInvalidationPortToken) {
          return ok(mockCache);
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          // Service resolution fails for reload
          return err({
            code: "TokenNotRegistered",
            message: "Service not found for reload",
            tokenDescription: String(token),
          });
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.unsetFlag).toHaveBeenCalled();
      // State should not be updated when service cannot be resolved for reload
    });

    it("should handle journal without name in error notification", async () => {
      const mockNotifications: NotificationPublisherPort = {
        warn: vi.fn(),
      } as unknown as NotificationPublisherPort;

      vi.mocked(mockRepository.unsetFlag).mockResolvedValueOnce(
        err({ code: "OPERATION_FAILED", message: "Failed" })
      );

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok(mockUI);
        }
        if (token === notificationPublisherPortToken) {
          return ok(mockNotifications);
        }
        if (token === cacheInvalidationPortToken) {
          return ok({ invalidateWhere: vi.fn() });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        filteredJournals: [
          { id: "journal-1", isHidden: true }, // No name
        ],
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        'Failed to change visibility for journal "journal-1"',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(mockRepository.unsetFlag).mockImplementation(() => {
        throw "String error";
      });

      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllVisible");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedError");
        expect(result.error.message).toBe("String error");
      }
    });
  });

  describe("setAllHidden handler", () => {
    let mockRepository: PlatformJournalRepository;

    beforeEach(() => {
      mockRepository = {
        setFlag: vi.fn().mockResolvedValue(ok(undefined)),
        unsetFlag: vi.fn().mockResolvedValue(ok(undefined)),
      } as unknown as PlatformJournalRepository;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok({ notify: vi.fn() });
        }
        if (token === cacheInvalidationPortToken) {
          return ok({ invalidateWhere: vi.fn() });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        filteredJournals: [
          { id: "journal-1", name: "Journal 1", isHidden: false },
          { id: "journal-2", name: "Journal 2", isHidden: false },
        ],
      });
    });

    it("should set all journals hidden", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "setAllHidden");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      expect(mockRepository.setFlag).toHaveBeenCalledTimes(2);
    });
  });

  describe("toggleAll handler", () => {
    let mockRepository: PlatformJournalRepository;

    beforeEach(() => {
      mockRepository = {
        setFlag: vi.fn().mockResolvedValue(ok(undefined)),
        unsetFlag: vi.fn().mockResolvedValue(ok(undefined)),
      } as unknown as PlatformJournalRepository;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === platformJournalRepositoryToken) {
          return ok(mockRepository);
        }
        if (token === platformUIPortToken) {
          return ok({ notify: vi.fn() });
        }
        if (token === cacheInvalidationPortToken) {
          return ok({ invalidateWhere: vi.fn() });
        }
        if (token === journalDirectoryRerenderSchedulerToken) {
          return ok({ requestRerender: vi.fn() });
        }
        if (token === journalOverviewServiceToken) {
          return ok(mockService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      });

      Object.assign((mockController as { state: Record<string, unknown> }).state, {
        filteredJournals: [
          { id: "journal-1", name: "Journal 1", isHidden: false },
          { id: "journal-2", name: "Journal 2", isHidden: true },
        ],
      });
    });

    it("should toggle all journals", async () => {
      const definition = createJournalOverviewWindowDefinition(mockComponent);
      const action = definition.actions?.find((a) => a.id === "toggleAll");
      const handler = action?.handler;
      expect(handler).toBeDefined();
      if (!handler) return;

      const result = await handler(context);

      expect(result.ok).toBe(true);
      // Should toggle: journal-1 (false -> true) uses setFlag, journal-2 (true -> false) uses unsetFlag
      expect(mockRepository.setFlag).toHaveBeenCalled();
      expect(mockRepository.unsetFlag).toHaveBeenCalled();
    });
  });
});

import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { ActionContext } from "@/domain/windows/types/action-definition.interface";
import { ok, err } from "@/domain/utils/result";
import type { Result } from "@/domain/types/result";
import type { JournalOverviewService } from "@/application/services/JournalOverviewService";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.interface";
import type { CacheInvalidationPort } from "@/domain/ports/cache/cache-invalidation-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalDirectoryRerenderScheduler } from "@/application/services/JournalDirectoryRerenderScheduler";
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
import { getControllerFromContext, getContainerFromContext } from "../utils/window-casts";
import { castResolvedService } from "../utils/service-casts";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { HIDDEN_JOURNAL_CACHE_TAG } from "@/application/services/JournalVisibilityService";
import type { JournalWithVisibility } from "@/application/services/JournalOverviewService";
import { createJournalSortComparator } from "./journal-sort-utils";

/**
 * WindowDefinition for Journal Overview Window.
 *
 * Displays all journals with their visibility status.
 * Uses Svelte component for rendering.
 *
 * Note: Container is passed via ActionContext.metadata by WindowController.
 *
 * @param component - The Svelte component to use for rendering (provided by framework layer)
 */
export function createJournalOverviewWindowDefinition(component: unknown): WindowDefinition {
  return {
    definitionId: "journal-overview",
    title: "Journal-Übersicht",
    icon: "fas fa-list",
    component: {
      type: "svelte",
      component,
      props: {},
    },
    features: {
      resizable: true,
      minimizable: true,
      draggable: true,
      closable: true,
    },
    position: {
      width: 800,
      height: 600,
      centered: true,
    },
    actions: [
      {
        id: "onOpen",
        handler: async (context: ActionContext) => {
          try {
            // Get controller and container from metadata
            const controller = getControllerFromContext(context);
            const container = getContainerFromContext(context);

            if (!controller) {
              return err({
                code: "InvalidContext",
                message: "Controller not found in context",
              });
            }

            if (!container) {
              return err({
                code: "InvalidContext",
                message: "Container not found in context",
              });
            }

            // Set loading state
            await controller.updateStateLocal({
              isLoading: true,
              error: null,
            });

            // Get service from container
            const serviceResult = container.resolveWithError(journalOverviewServiceToken);
            if (!serviceResult.ok) {
              await controller.updateStateLocal({
                isLoading: false,
                error: `Failed to resolve JournalOverviewService: ${serviceResult.error.message}`,
              });
              return err({
                code: "ServiceNotFound",
                message: `Failed to resolve JournalOverviewService: ${serviceResult.error.message}`,
              });
            }

            const service = castResolvedService<JournalOverviewService>(serviceResult.value);

            // Load journals
            const result = service.getAllJournalsWithVisibilityStatus();
            if (!result.ok) {
              await controller.updateStateLocal({
                isLoading: false,
                error: result.error.message,
              });
              return err({
                code: "LoadFailed",
                message: result.error.message,
              });
            }

            // Update state with journals and initialize filter/sort state
            await controller.updateStateLocal({
              isLoading: false,
              error: null,
              journals: result.value,
              sortColumn: null,
              sortDirection: "asc" as const,
              columnFilters: {},
              globalSearch: "",
            });

            // Apply filters to initialize filteredJournals
            await controller.dispatchAction("applyFilters");

            return ok(undefined);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err({
              code: "UnexpectedError",
              message: errorMessage,
            });
          }
        },
      },
      {
        id: "toggleJournalVisibility",
        handler: async (context: ActionContext) => {
          try {
            const controller = getControllerFromContext(context);
            const container = getContainerFromContext(context);

            if (!controller || !container) {
              return err({
                code: "InvalidContext",
                message: "Controller or container not found in context",
              });
            }

            // Get journalId from metadata
            const journalId =
              context.metadata && typeof context.metadata.journalId === "string"
                ? context.metadata.journalId
                : undefined;
            if (!journalId) {
              return err({
                code: "InvalidParameter",
                message: "journalId not provided in metadata",
              });
            }

            // Get current state
            const currentState = controller.state as {
              journals?: JournalWithVisibility[];
              [key: string]: unknown;
            };
            const journals = Array.isArray(currentState.journals) ? currentState.journals : [];
            const journal = journals.find((j) => j.id === journalId);
            if (!journal) {
              return err({
                code: "JournalNotFound",
                message: `Journal ${journalId} not found`,
              });
            }

            // Get repository
            const repoResult = container.resolveWithError(platformJournalRepositoryToken);
            if (!repoResult.ok) {
              return err({
                code: "ServiceNotFound",
                message: `Failed to resolve PlatformJournalRepository: ${repoResult.error.message}`,
              });
            }

            const repository = castResolvedService<PlatformJournalRepository>(repoResult.value);

            // Toggle visibility
            const newVisibility = !journal.isHidden;
            let flagResult: Result<void, EntityRepositoryError>;
            if (newVisibility) {
              flagResult = await repository.setFlag(
                journalId,
                MODULE_METADATA.ID,
                DOMAIN_FLAGS.HIDDEN,
                true
              );
            } else {
              flagResult = await repository.setFlag(
                journalId,
                MODULE_METADATA.ID,
                DOMAIN_FLAGS.HIDDEN,
                false
              );
            }

            if (!flagResult.ok) {
              return err({
                code: "ToggleFailed",
                message: flagResult.error.message,
              });
            }

            // Invalidate cache
            const cacheResult = container.resolveWithError(cacheInvalidationPortToken);
            if (cacheResult.ok) {
              const cache = castResolvedService<CacheInvalidationPort>(cacheResult.value);
              cache.invalidateWhere((meta) => meta.tags.includes(HIDDEN_JOURNAL_CACHE_TAG));
            }

            // Trigger journal directory re-render to show/hide the journal
            // This is especially important when making a journal visible again
            const schedulerResult = container.resolveWithError(
              journalDirectoryRerenderSchedulerToken
            );
            if (schedulerResult.ok) {
              const scheduler = castResolvedService<JournalDirectoryRerenderScheduler>(
                schedulerResult.value
              );
              scheduler.requestRerender();
            }

            // Reload data
            const serviceResult = container.resolveWithError(journalOverviewServiceToken);
            if (serviceResult.ok) {
              const service = castResolvedService<JournalOverviewService>(serviceResult.value);
              const reloadResult = service.getAllJournalsWithVisibilityStatus();
              if (reloadResult.ok) {
                await controller.updateStateLocal({
                  journals: reloadResult.value,
                });
                // Re-apply filters
                await controller.dispatchAction("applyFilters");
              }
            }

            return ok(undefined);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err({
              code: "UnexpectedError",
              message: errorMessage,
            });
          }
        },
      },
      {
        id: "setAllVisible",
        handler: async (context: ActionContext) => {
          return handleBulkVisibilityChange(context, false);
        },
      },
      {
        id: "setAllHidden",
        handler: async (context: ActionContext) => {
          return handleBulkVisibilityChange(context, true);
        },
      },
      {
        id: "toggleAll",
        handler: async (context: ActionContext) => {
          return handleBulkVisibilityChange(context, null); // null = toggle
        },
      },
      {
        id: "setSort",
        handler: async (context: ActionContext) => {
          try {
            const controller = getControllerFromContext(context);
            if (!controller) {
              return err({
                code: "InvalidContext",
                message: "Controller not found in context",
              });
            }

            const column =
              context.metadata && typeof context.metadata.column === "string"
                ? context.metadata.column
                : undefined;
            if (!column) {
              return err({
                code: "InvalidParameter",
                message: "column not provided in metadata",
              });
            }

            // Always use controller.state to get the most recent state
            // context.state might be outdated
            const currentState = controller.state as {
              sortColumn?: string | null;
              sortDirection?: "asc" | "desc";
              [key: string]: unknown;
            };

            const currentSortColumn = currentState.sortColumn ?? null;
            const currentSortDirection = currentState.sortDirection || "asc";

            const newSortColumn: string | null = column;
            let newSortDirection: "asc" | "desc" = "asc";

            if (currentSortColumn === column) {
              if (currentSortDirection === "asc") {
                // Second click: switch to desc
                newSortDirection = "desc";
              } else {
                // Third click: switch back to asc (cycle between asc and desc)
                newSortDirection = "asc";
              }
            }

            // Update state
            await controller.updateStateLocal({
              sortColumn: newSortColumn,
              sortDirection: newSortDirection,
            });

            // Re-apply filters - controller.state will now have the updated sortColumn/sortDirection
            await controller.dispatchAction("applyFilters");

            return ok(undefined);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err({
              code: "UnexpectedError",
              message: errorMessage,
            });
          }
        },
      },
      {
        id: "setColumnFilter",
        handler: async (context: ActionContext) => {
          try {
            const controller = getControllerFromContext(context);
            if (!controller) {
              return err({
                code: "InvalidContext",
                message: "Controller not found in context",
              });
            }

            const column =
              context.metadata && typeof context.metadata.column === "string"
                ? context.metadata.column
                : undefined;
            const value =
              context.metadata && typeof context.metadata.value === "string"
                ? context.metadata.value
                : undefined;

            if (!column) {
              return err({
                code: "InvalidParameter",
                message: "column not provided in metadata",
              });
            }

            const currentState = controller.state as {
              columnFilters?: Record<string, string>;
              [key: string]: unknown;
            };

            const currentFilters = currentState.columnFilters || {};
            const newFilters = { ...currentFilters };
            if (value === undefined || value === "") {
              delete newFilters[column];
            } else {
              newFilters[column] = value;
            }

            await controller.updateStateLocal({
              columnFilters: newFilters,
            });

            // Re-apply filters
            await controller.dispatchAction("applyFilters");

            return ok(undefined);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err({
              code: "UnexpectedError",
              message: errorMessage,
            });
          }
        },
      },
      {
        id: "setGlobalSearch",
        handler: async (context: ActionContext) => {
          try {
            const controller = getControllerFromContext(context);
            if (!controller) {
              return err({
                code: "InvalidContext",
                message: "Controller not found in context",
              });
            }

            const value =
              context.metadata && typeof context.metadata.value === "string"
                ? context.metadata.value
                : undefined;

            await controller.updateStateLocal({
              globalSearch: value ?? "",
            });

            // Re-apply filters
            await controller.dispatchAction("applyFilters");

            return ok(undefined);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err({
              code: "UnexpectedError",
              message: errorMessage,
            });
          }
        },
      },
      {
        id: "applyFilters",
        handler: async (context: ActionContext) => {
          try {
            const controller = getControllerFromContext(context);
            if (!controller) {
              return err({
                code: "InvalidContext",
                message: "Controller not found in context",
              });
            }

            // Always use controller.state (which uses statePort.get()) to get the most recent state
            // context.state might be outdated if called after updateStateLocal
            const currentState = controller.state as {
              journals?: JournalWithVisibility[];
              globalSearch?: string;
              columnFilters?: Record<string, string>;
              sortColumn?: string | null;
              sortDirection?: "asc" | "desc";
              [key: string]: unknown;
            };

            // Ensure journals is an array
            const journals = Array.isArray(currentState.journals) ? currentState.journals : [];
            const globalSearch = currentState.globalSearch || "";
            const columnFilters = currentState.columnFilters || {};
            const sortColumn = currentState.sortColumn ?? null;
            const sortDirection = currentState.sortDirection || "asc";

            // Apply filters
            let filtered = [...journals];

            // Global search
            if (globalSearch) {
              const searchLower = globalSearch.toLowerCase();
              filtered = filtered.filter((journal) => {
                const name = (journal.name || journal.id).toLowerCase();
                const status = journal.isHidden ? "versteckt" : "sichtbar";
                return name.includes(searchLower) || status.includes(searchLower);
              });
            }

            // Column filters
            if (columnFilters.name) {
              const filterLower = columnFilters.name.toLowerCase();
              filtered = filtered.filter((journal) => {
                const name = (journal.name || journal.id).toLowerCase();
                return name.includes(filterLower);
              });
            }

            if (columnFilters.status) {
              const filterLower = columnFilters.status.toLowerCase();
              filtered = filtered.filter((journal) => {
                const status = journal.isHidden ? "versteckt" : "sichtbar";
                return status.includes(filterLower);
              });
            }

            // Sort
            if (sortColumn && (sortColumn === "name" || sortColumn === "status")) {
              filtered.sort(createJournalSortComparator(sortColumn, sortDirection));
            }

            await controller.updateStateLocal({
              filteredJournals: filtered,
            });

            return ok(undefined);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err({
              code: "UnexpectedError",
              message: errorMessage,
            });
          }
        },
      },
      {
        id: "refreshData",
        handler: async (context: ActionContext) => {
          try {
            const controller = getControllerFromContext(context);
            const container = getContainerFromContext(context);

            if (!controller || !container) {
              return err({
                code: "InvalidContext",
                message: "Controller or container not found in context",
              });
            }

            // Get service from container
            const serviceResult = container.resolveWithError(journalOverviewServiceToken);
            if (!serviceResult.ok) {
              return err({
                code: "ServiceNotFound",
                message: `Failed to resolve JournalOverviewService: ${serviceResult.error.message}`,
              });
            }

            const service = castResolvedService<JournalOverviewService>(serviceResult.value);

            // Load journals
            const result = service.getAllJournalsWithVisibilityStatus();
            if (!result.ok) {
              return err({
                code: "LoadFailed",
                message: result.error.message,
              });
            }

            // Update state with journals
            await controller.updateStateLocal({
              journals: result.value,
            });

            // Re-apply filters
            await controller.dispatchAction("applyFilters");

            return ok(undefined);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err({
              code: "UnexpectedError",
              message: errorMessage,
            });
          }
        },
      },
    ],
  };
}

/**
 * Helper function for bulk visibility changes.
 * @param context - Action context
 * @param targetVisibility - true = hidden, false = visible, null = toggle
 */
async function handleBulkVisibilityChange(
  context: ActionContext,
  targetVisibility: boolean | null
): Promise<
  import("@/domain/types/result").Result<
    void,
    import("@/domain/windows/types/errors/action-error.interface").ActionError
  >
> {
  try {
    const controller = getControllerFromContext(context);
    const container = getContainerFromContext(context);

    if (!controller || !container) {
      return err({
        code: "InvalidContext",
        message: "Controller or container not found in context",
      });
    }

    // Get current filtered journals
    const currentState = controller.state as {
      filteredJournals?: JournalWithVisibility[];
      [key: string]: unknown;
    };

    const filteredJournals = Array.isArray(currentState.filteredJournals)
      ? currentState.filteredJournals
      : [];

    if (filteredJournals.length === 0) {
      return ok(undefined); // Nothing to do
    }

    // Get repository
    const repoResult = container.resolveWithError(platformJournalRepositoryToken);
    if (!repoResult.ok) {
      return err({
        code: "ServiceNotFound",
        message: `Failed to resolve PlatformJournalRepository: ${repoResult.error.message}`,
      });
    }

    const repository = castResolvedService<PlatformJournalRepository>(repoResult.value);

    // Get UI and notifications for feedback
    const uiResult = container.resolveWithError(platformUIPortToken);
    const notificationsResult = container.resolveWithError(notificationPublisherPortToken);
    const ui = uiResult.ok ? castResolvedService<PlatformUIPort>(uiResult.value) : null;
    const notifications = notificationsResult.ok
      ? castResolvedService<NotificationPublisherPort>(notificationsResult.value)
      : null;

    // Process all journals
    let successCount = 0;
    let errorCount = 0;

    for (const journal of filteredJournals) {
      const shouldBeHidden = targetVisibility === null ? !journal.isHidden : targetVisibility;

      const flagResult = shouldBeHidden
        ? await repository.setFlag(journal.id, MODULE_METADATA.ID, DOMAIN_FLAGS.HIDDEN, true)
        : await repository.setFlag(journal.id, MODULE_METADATA.ID, DOMAIN_FLAGS.HIDDEN, false);

      if (flagResult.ok) {
        successCount++;
      } else {
        errorCount++;
        if (notifications) {
          notifications.warn(
            `Failed to change visibility for journal "${journal.name || journal.id}"`,
            { error: flagResult.error },
            { channels: ["ConsoleChannel"] }
          );
        }
      }
    }

    // Invalidate cache
    const cacheResult = container.resolveWithError(cacheInvalidationPortToken);
    if (cacheResult.ok) {
      const cache = castResolvedService<CacheInvalidationPort>(cacheResult.value);
      cache.invalidateWhere((meta) => meta.tags.includes(HIDDEN_JOURNAL_CACHE_TAG));
    }

    // Trigger journal directory re-render to show/hide the journals
    // This is especially important when making journals visible again
    const schedulerResult = container.resolveWithError(journalDirectoryRerenderSchedulerToken);
    if (schedulerResult.ok) {
      const scheduler = castResolvedService<JournalDirectoryRerenderScheduler>(
        schedulerResult.value
      );
      scheduler.requestRerender();
    }

    // Show notification
    if (ui) {
      const actionName =
        targetVisibility === null ? "umschalten" : targetVisibility ? "verstecken" : "anzeigen";
      const message =
        errorCount > 0
          ? `${successCount} Journals ${actionName}, ${errorCount} Fehler`
          : `${successCount} Journals ${actionName}`;
      ui.notify(message, "info");
    }

    // Reload data
    const serviceResult = container.resolveWithError(journalOverviewServiceToken);
    if (serviceResult.ok) {
      const service = castResolvedService<JournalOverviewService>(serviceResult.value);
      const reloadResult = service.getAllJournalsWithVisibilityStatus();
      if (reloadResult.ok) {
        await controller.updateStateLocal({
          journals: reloadResult.value,
        });
        // Re-apply filters
        await controller.dispatchAction("applyFilters");
      }
    }

    return ok(undefined);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return err({
      code: "UnexpectedError",
      message: errorMessage,
    });
  }
}

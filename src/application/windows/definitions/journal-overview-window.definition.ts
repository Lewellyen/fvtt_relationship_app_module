import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { ActionContext } from "@/domain/windows/types/action-definition.interface";
import { ok, err } from "@/domain/utils/result";
import type { JournalOverviewService } from "@/application/services/JournalOverviewService";
import { journalOverviewServiceToken } from "@/application/tokens/application.tokens";
import { getControllerFromContext, getContainerFromContext } from "../utils/window-casts";
import { castResolvedService } from "../utils/service-casts";

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

            // Update state with journals
            await controller.updateStateLocal({
              isLoading: false,
              error: null,
              journals: result.value,
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
    ],
  };
}

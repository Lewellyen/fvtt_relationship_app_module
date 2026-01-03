import type { Result } from "@/domain/types/result";
import type { WindowError } from "../types/errors/window-error.interface";
import type { ActionContext } from "../types/action-definition.interface";

/**
 * IActionDispatcher - Führt Actions aus (Command-Pattern)
 */
export interface IActionDispatcher {
  /**
   * Führt eine Action aus.
   *
   * @param actionId - Action-ID
   * @param context - ActionContext
   * @returns Result
   */
  dispatch(actionId: string, context: ActionContext): Promise<Result<void, WindowError>>;
}

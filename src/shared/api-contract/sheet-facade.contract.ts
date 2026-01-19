import type { Result } from "@/domain/types/result";

/**
 * API Contract for Foundry-instantiated entrypoints (Sheets, Application wrappers).
 *
 * These classes must behave like third-party modules and may only access
 * internal functionality via module.api using API-safe tokens.
 *
 * This contract is intentionally small and framework-agnostic.
 */

export interface SheetFacadeError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Facade for sheet workflows that require internal services.
 *
 * IMPORTANT:
 * - Accepts `unknown` payloads because the sheet boundary deals with UI state.
 * - Performs validation/mapping internally (via injected services).
 */
export interface SheetFacadeContract {
  loadNodeData(pageId: string): Promise<Result<unknown, SheetFacadeError>>;
  saveNodeData(pageId: string, data: unknown): Promise<Result<void, SheetFacadeError>>;
  validateNodeData(data: unknown): Result<void, SheetFacadeError>;

  loadGraphData(pageId: string): Promise<Result<unknown, SheetFacadeError>>;
  saveGraphData(pageId: string, data: unknown): Promise<Result<void, SheetFacadeError>>;
  validateGraphData(data: unknown): Result<void, SheetFacadeError>;
}

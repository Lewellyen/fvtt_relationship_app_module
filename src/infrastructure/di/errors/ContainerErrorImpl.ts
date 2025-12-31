import type { ContainerError } from "../interfaces";
import type { ContainerErrorCode } from "../types/errors/containererrorcode";

/**
 * Concrete error class for container operations.
 *
 * Extends Error to ensure proper error behavior (stack traces, instanceof checks)
 * while implementing the ContainerError interface for type compatibility.
 *
 * **Design Rationale:**
 * - Follows Liskov Substitution Principle (LSP)
 * - Clients can rely on ContainerError contract being fulfilled
 * - Enables instanceof Error checks for compatibility
 * - Maintains all ContainerError fields for structured error handling
 *
 * @example
 * ```typescript
 * throw new ContainerErrorImpl({
 *   code: "TokenNotRegistered",
 *   message: "Service not found",
 *   tokenDescription: "LoggerToken"
 * });
 * ```
 */
export class ContainerErrorImpl extends Error implements ContainerError {
  public readonly code: ContainerErrorCode;
  public readonly cause?: unknown;
  public readonly tokenDescription?: string;
  public readonly details?: unknown;
  public override readonly stack?: string;
  public readonly timestamp?: number;
  public readonly containerScope?: string;

  constructor(error: ContainerError) {
    super(error.message);
    this.name = "ContainerError";
    this.code = error.code;

    // Handle optional properties correctly for exactOptionalPropertyTypes
    // Only assign if defined (not undefined)
    if (error.cause !== undefined) {
      this.cause = error.cause;
    }
    if (error.tokenDescription !== undefined) {
      this.tokenDescription = error.tokenDescription;
    }
    if (error.details !== undefined) {
      this.details = error.details;
    }
    if (error.stack !== undefined) {
      this.stack = error.stack;
    }
    if (error.timestamp !== undefined) {
      this.timestamp = error.timestamp;
    }
    if (error.containerScope !== undefined) {
      this.containerScope = error.containerScope;
    }
  }
}

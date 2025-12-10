import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../interfaces";
import type { ContainerValidationState } from "../types/errors/containervalidationstate";
import type { ServiceRegistry } from "../registry/ServiceRegistry";
import { ContainerValidator } from "./ContainerValidator";
import { ok, err } from "@/domain/utils/result";

/**
 * Manages container validation and validation state.
 *
 * Responsibilities:
 * - Manages validation state (registering, validating, validated)
 * - Delegates validation to ContainerValidator
 * - Handles async validation with timeout
 * - Manages validation promise for concurrent access
 *
 * Design:
 * - State management is responsibility of this manager
 * - Validation logic is delegated to ContainerValidator
 */
export class ContainerValidationManager {
  private validationState: ContainerValidationState;
  private validationPromise: Promise<Result<void, ContainerError[]>> | null = null;

  constructor(
    private readonly validator: ContainerValidator,
    private readonly registry: ServiceRegistry,
    initialState: ContainerValidationState = "registering"
  ) {
    this.validationState = initialState;
  }

  /**
   * Validate all registrations.
   */
  validate(): Result<void, ContainerError[]> {
    if (this.validationState === "validated") {
      return ok(undefined);
    }

    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress",
        },
      ]);
    }

    this.validationState = "validating";

    const result = this.validator.validate(this.registry);

    if (result.ok) {
      this.validationState = "validated";
    } else {
      this.validationState = "registering";
    }

    return result;
  }

  /**
   * Async-safe validation for concurrent environments with timeout.
   */
  async validateAsync(
    timeoutMs: number,
    withTimeout: <T>(promise: Promise<T>, timeoutMs: number) => Promise<T>,
    TimeoutErrorClass: new (timeoutMs: number) => Error
  ): Promise<Result<void, ContainerError[]>> {
    // Return immediately if already validated
    if (this.validationState === "validated") {
      return ok(undefined);
    }

    // Wait for ongoing validation
    if (this.validationPromise !== null) {
      return this.validationPromise;
    }

    // Validation already in progress (sync)
    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress",
        },
      ]);
    }

    this.validationState = "validating";

    // Track if timeout occurred to prevent state changes after timeout
    let timedOut = false;

    // Create validation task
    const validationTask = Promise.resolve().then(() => {
      const result = this.validator.validate(this.registry);

      // Only update state if no timeout occurred
      if (!timedOut) {
        if (result.ok) {
          this.validationState = "validated";
        } else {
          this.validationState = "registering";
        }
      }

      return result;
    });

    // Wrap validation with timeout
    try {
      this.validationPromise = withTimeout(validationTask, timeoutMs);
      const result = await this.validationPromise;
      return result;
    } catch (error) {
      // Handle timeout
      if (error instanceof TimeoutErrorClass) {
        timedOut = true; // Mark timeout occurred
        this.validationState = "registering"; // Reset deterministically
        return err([
          {
            code: "InvalidOperation",
            message: `Validation timed out after ${timeoutMs}ms`,
          },
        ]);
      }
      // Re-throw unexpected errors
      throw error;
    } finally {
      this.validationPromise = null;
    }
  }

  /**
   * Get validation state.
   */
  getValidationState(): ContainerValidationState {
    return this.validationState;
  }

  /**
   * Reset validation state (used after disposal or clear).
   */
  resetValidationState(): void {
    this.validationState = "registering";
  }
}

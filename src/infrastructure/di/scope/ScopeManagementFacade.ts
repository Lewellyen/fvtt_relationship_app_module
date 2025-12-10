import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../interfaces";
import type { ContainerValidationState } from "../types/errors/containervalidationstate";
import { ScopeManager } from "./ScopeManager";
import { err } from "@/domain/utils/result";

/**
 * Facade for scope management operations.
 *
 * Responsibilities:
 * - Delegates scope creation to ScopeManager
 * - Validates disposal state before scope creation
 * - Validates validation state before scope creation
 *
 * Design:
 * - Pure delegation to ScopeManager for scope operations
 * - State checks (disposal, validation) are responsibility of this facade
 * - Child container creation is handled by ServiceContainer to avoid circular dependency
 */
export class ScopeManagementFacade {
  constructor(
    private readonly scopeManager: ScopeManager,
    private readonly isDisposed: () => boolean,
    private readonly getValidationState: () => ContainerValidationState
  ) {}

  /**
   * Validates that a scope can be created.
   * Returns the scope creation result if valid, or an error if not.
   */
  validateScopeCreation(
    name?: string
  ): Result<{ scopeName: string; cache: InstanceCache; manager: ScopeManager }, ContainerError> {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot create scope from disposed container`,
      });
    }

    if (this.getValidationState() !== "validated") {
      return err({
        code: "NotValidated",
        message: "Parent must be validated before creating scopes. Call validate() first.",
      });
    }

    // Create child scope (pure Result, no throws)
    return this.scopeManager.createChild(name);
  }
}

// Import here to avoid circular dependency
import type { InstanceCache } from "../cache/InstanceCache";

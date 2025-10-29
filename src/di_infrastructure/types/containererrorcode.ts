/**
 * Error codes for container operations.
 * Provides type-safe classification of container errors.
 *
 * @typedef {string} ContainerErrorCode
 *
 * @example
 * ```typescript
 * const error: ContainerError = {
 *   code: "TokenNotRegistered",
 *   message: "Service not found"
 * };
 * ```
 */
export type ContainerErrorCode =
  | "TokenNotRegistered" // Service was not registered in the container
  | "DuplicateRegistration" // Attempt to register the same service twice
  | "FactoryFailed" // Factory function threw an error
  | "CircularDependency" // Circular dependency detected between services
  | "Disposed" // Container or service has been disposed
  | "ScopeRequired" // Scoped service requires a child container
  | "DisposalFailed" // Error occurred during dispose() operation
  | "InvalidLifecycle" // Invalid service lifecycle configuration
  | "InvalidOperation" // General invalid operation error
  | "NotValidated" // Container must be validated before resolving
  | "AliasTargetNotFound"; // Alias points to a token that is not registered

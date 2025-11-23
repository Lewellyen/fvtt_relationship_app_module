/**
 * Dedicated error classes for DI container operations.
 * These errors provide precise failure categorization and preserve cause chains.
 */

/**
 * Thrown when a circular dependency is detected during service resolution.
 */
export class CircularDependencyError extends Error {
  public readonly errorCause?: unknown;

  constructor(
    message: string,
    public readonly token: symbol,
    cause?: unknown
  ) {
    super(message);
    this.name = "CircularDependencyError";
    this.errorCause = cause;
  }
}

/**
 * Thrown when a scoped service is resolved from a root container (requires child scope).
 */
export class ScopeRequiredError extends Error {
  public readonly errorCause?: unknown;

  constructor(
    message: string,
    public readonly token: symbol,
    cause?: unknown
  ) {
    super(message);
    this.name = "ScopeRequiredError";
    this.errorCause = cause;
  }
}

/**
 * Thrown when an invalid or unsupported service lifecycle is encountered.
 */
export class InvalidLifecycleError extends Error {
  public readonly errorCause?: unknown;

  constructor(
    message: string,
    public readonly lifecycle: unknown,
    cause?: unknown
  ) {
    super(message);
    this.name = "InvalidLifecycleError";
    this.errorCause = cause;
  }
}

/**
 * Thrown when a factory function fails during service instantiation.
 */
export class FactoryFailedError extends Error {
  public readonly errorCause?: unknown;

  constructor(
    message: string,
    public readonly token: symbol,
    cause?: unknown
  ) {
    super(message);
    this.name = "FactoryFailedError";
    this.errorCause = cause;
  }
}

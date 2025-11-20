/**
 * Represents the validation state of the DI container.
 * The container follows a 3-phase lifecycle: registration, validation, and ready.
 *
 * **States:**
 * - `'registering'` - Services are being registered. No validation has occurred yet.
 * - `'validating'` - Validation is in progress (used internally to prevent concurrent validation).
 * - `'validated'` - Validation completed successfully. Services can now be resolved and scopes created.
 *
 * @typedef {'registering' | 'validating' | 'validated'} ContainerValidationState
 *
 * @example
 * ```typescript
 * const container = ServiceContainer.createRoot();
 *
 * // Phase 1: Registration
 * container.getValidationState();  // 'registering'
 *
 * // Phase 2: Validation
 * container.validate();
 * container.getValidationState();  // 'validated'
 *
 * // Phase 3: Ready (services can now be resolved)
 * container.resolve(LoggerToken);
 * ```
 */
export type ContainerValidationState = "registering" | "validating" | "validated";

import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../../interfaces";

/**
 * Type for factory functions used in dependency injection.
 */

/**
 * Type alias for factory functions that create instances.
 * Self-documenting: makes it clear this is a factory function pattern.
 *
 * **Features:**
 * - No type constraints: can create any type (services, values, primitives)
 * - Function signature: `() => T`
 * - Lazily executed when service is resolved
 * - Container caches instances based on lifecycle (Singleton/Transient/Scoped)
 *
 * @template T - The type this factory creates (no constraint - can be any type)
 * @returns A new instance of type T
 *
 * @example
 * ```typescript
 * // Simple factory
 * const loggerFactory: FactoryFunction<Logger> = () => new Logger();
 *
 * // Factory with complex logic
 * const configFactory: FactoryFunction<Config> = () => {
 *   const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
 *   return config;
 * };
 *
 * // Factory with dependencies
 * container.registerFactory(
 *   ConfigToken,
 *   () => loadConfig(),
 *   SINGLETON,
 *   []
 * );
 * ```
 */
export type FactoryFunction<T> = () => T;

/**
 * Type alias for factory functions that return Result instead of throwing exceptions.
 * This adheres to the project's Result Pattern principle.
 *
 * **Features:**
 * - Returns `Result<T, ContainerError>` instead of throwing exceptions
 * - Allows factories to propagate errors using the Result Pattern
 * - Container unwraps the Result automatically
 * - Lazily executed when service is resolved
 * - Container caches instances based on lifecycle (Singleton/Transient/Scoped)
 *
 * **When to use:**
 * - When factory needs to resolve dependencies using `resolveWithError()`
 * - When factory needs to handle errors without throwing exceptions
 * - When adhering to Result Pattern is required
 *
 * @template T - The type this factory creates (no constraint - can be any type)
 * @returns Result with instance or ContainerError
 *
 * @example
 * ```typescript
 * // Factory that resolves dependencies using Result Pattern
 * const handlersFactory: ResultFactoryFunction<Handler[]> = () => {
 *   const handlerResult = container.resolveWithError(handlerToken);
 *   if (!handlerResult.ok) {
 *     return err({
 *       code: "DependencyResolveFailed",
 *       message: `Failed to resolve handler: ${handlerResult.error.message}`,
 *       tokenDescription: String(handlerToken),
 *       cause: handlerResult.error,
 *     });
 *   }
 *   return ok([handlerResult.value]);
 * };
 *
 * container.registerResultFactory(
 *   handlersToken,
 *   handlersFactory,
 *   SINGLETON,
 *   [handlerToken]
 * );
 * ```
 */
export type ResultFactoryFunction<T> = () => Result<T, ContainerError>;

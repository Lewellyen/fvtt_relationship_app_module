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

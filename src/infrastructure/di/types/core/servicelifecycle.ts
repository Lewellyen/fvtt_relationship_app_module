/**
 * Enum for service lifecycle strategies in dependency injection.
 *
 * - SINGLETON: One shared instance across the entire application
 * - TRANSIENT: New instance created on each resolution
 * - SCOPED: One instance per container scope
 *
 * @enum {string}
 * @property {string} SINGLETON - One instance for all
 * @property {string} TRANSIENT - New instance for each resolve()
 * @property {string} SCOPED - One instance per scope
 */
export enum ServiceLifecycle {
  SINGLETON = "singleton",
  TRANSIENT = "transient",
  SCOPED = "scoped",
}

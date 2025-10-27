// ServiceLifecycle.ts: enum for service lifecycle
/**
 * Enum for service lifecycle.
 * 
 * @enum {string}
 * @property {string} SINGLETON - One instance for all
 * @property {string} TRANSIENT - New instance for each resolve()
 * @property {string} SCOPED - One instance per scope
 */
export enum ServiceLifecycle {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
  SCOPED = 'scoped'
}
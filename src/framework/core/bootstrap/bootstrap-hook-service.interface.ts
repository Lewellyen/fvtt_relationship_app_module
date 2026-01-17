/**
 * Framework-layer interface for bootstrap hook services.
 *
 * Kept in Framework to avoid Framework-Core importing Infrastructure type locations.
 */
export interface BootstrapHookService {
  register(): void;
}

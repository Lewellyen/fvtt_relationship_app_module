/**
 * Interface for bootstrap ready hook service.
 * Extracted from Framework layer to avoid Infrastructure → Framework dependency.
 */
export interface BootstrapReadyHookService {
  /**
   * Registers the ready event.
   */
  register(): void;
}
